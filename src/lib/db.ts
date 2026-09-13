/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firestore data layer for BORROWHUB - PER-USER separated storage.
 *
 * Path layout:
 *   users/{userId}                       - user profile (students/teachers registered via LINE)
 *   users/{userId}/items/{itemId}        - items OWNED by this user (per-user copy)
 *   users/{userId}/borrow_requests/{id}  - request copy written for every involved user
 *                                          (borrower, item owner, admins for school items)
 *   users/{userId}/notifications/{id}    - notifications for this user (private to the user)
 *   catalog/{itemId}                     - SHARED catalog of all items (readable by everyone)
 *   requests_feed/{reqId}                - SHARED realtime feed of all requests (admin overview)
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  deleteField,
  deleteDoc,
  DocumentReference,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';
import { User, Item, BorrowRequest, LineNotification } from '../types';
import {
  INITIAL_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

export const COLLECTIONS = {
  users: 'users',
  catalog: 'catalog',
  requestsFeed: 'requests_feed',
  userItems: 'items',
  userRequests: 'borrow_requests',
  userNotifications: 'notifications',
} as const;

export type FirestoreStatus = 'connecting' | 'online' | 'offline';

// localStorage cache keys (same names as before for offline-first)
const LS_KEYS = {
  users: 'borrowhub_users',
  items: 'borrowhub_items',
  requests: 'borrowhub_requests',
  notifications: 'borrowhub_notifications',
} as const;

// Prevent re-seeding after the user clears their own data - a localStorage flag
const SEED_FLAG_PREFIX = 'borrowhub_fs_seeded_';

/** Scope of the realtime subscription (the currently logged-in app user). */
export interface SubscribeScope {
  /** App user id (users/{userId}) - from LINE registration */
  userId?: string;
  /** true when the current user is an admin / teacher */
  isAdmin?: boolean;
}

interface SyncHandlers {
  onUsers: (rows: User[]) => void;
  onItems: (rows: Item[]) => void;
  onRequests: (rows: BorrowRequest[]) => void;
  onNotifications: (rows: LineNotification[]) => void;
}

/** Firestore rejects undefined values - such fields are deleted from the doc instead. */
function clean(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v === undefined ? deleteField() : v;
  }
  return out;
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function hasSeedFlag(col: string): boolean {
  try {
    return localStorage.getItem(SEED_FLAG_PREFIX + col) === '1';
  } catch {
    return false;
  }
}

function markSeedFlag(col: string): void {
  try {
    localStorage.setItem(SEED_FLAG_PREFIX + col, '1');
  } catch {
    /* ignore */
  }
}

/** Every user subtree that keeps a copy of this request (borrower + owner + admins). */
function requestTargets(req: BorrowRequest): string[] {
  const uids: string[] = [];
  const push = (uid?: string) => {
    if (uid && !uids.includes(uid)) uids.push(uid);
  };
  push(req.borrowerId);
  push(req.ownerId);
  if (Array.isArray(req.readerUids)) req.readerUids.forEach(push);
  return uids;
}

/** All target docs for a request: per-user copies + the shared admin feed. */
function requestRefs(req: BorrowRequest): DocumentReference[] {
  const refs: DocumentReference[] = [];
  const seen: string[] = [];
  const add = (p: string, id: string) => {
    const key = `${p}/${id}`;
    if (!seen.includes(key)) {
      seen.push(key);
      refs.push(doc(db!, p, id));
    }
  };
  requestTargets(req).forEach((uid) =>
    add(`${COLLECTIONS.users}/${uid}/${COLLECTIONS.userRequests}`, req.id),
  );
  add(COLLECTIONS.requestsFeed, req.id);
  return refs;
}

/** Seed users + per-user request/notification copies (idempotent - same doc ids). */
async function seedUsersAndPrivate(rows: User[]): Promise<void> {
  markSeedFlag(COLLECTIONS.users);
  try {
    const batch = writeBatch(db!);
    const now = Date.now();
    rows.slice(0, 450).forEach((u, i) => {
      batch.set(doc(db!, COLLECTIONS.users, u.id), clean({ ...u, updatedAtMs: now - i * 1000 }));
    });
    INITIAL_REQUESTS.slice(0, 450).forEach((r, i) => {
      requestTargets(r).forEach((uid) =>
        batch.set(
          doc(db!, COLLECTIONS.users, uid, COLLECTIONS.userRequests, r.id),
          clean({ ...r, createdAtMs: r.createdAtMs ?? now - i * 1000, updatedAtMs: now - i * 1000 }),
        ),
      );
    });
    INITIAL_NOTIFICATIONS.slice(0, 450).forEach((n, i) => {
      if (!n.recipientUserId) return;
      batch.set(
        doc(db!, COLLECTIONS.users, n.recipientUserId, COLLECTIONS.userNotifications, n.id),
        clean({ ...n, updatedAtMs: now - i * 1000 }),
      );
    });
    await batch.commit();
    console.log(`[Firestore] seeded users + per-user copies (${Math.min(rows.length, 450)} users)`);
  } catch (err) {
    console.warn('[Firestore] seed users/private failed:', err);
  }
}

/** Seed the SHARED catalog (all items) - readable by everyone. */
async function seedCatalog(rows: Item[]): Promise<void> {
  markSeedFlag(COLLECTIONS.catalog);
  if (!rows.length) return;
  try {
    const batch = writeBatch(db!);
    const now = Date.now();
    rows.slice(0, 450).forEach((item, i) => {
      const data = clean({ ...item, createdAtMs: now - i * 1000, updatedAtMs: now - i * 1000 });
      batch.set(doc(db!, COLLECTIONS.catalog, item.id), data);
      if (item.ownerId) {
        batch.set(doc(db!, COLLECTIONS.users, item.ownerId, COLLECTIONS.userItems, item.id), data);
      }
    });
    await batch.commit();
    console.log(`[Firestore] seeded catalog (${Math.min(rows.length, 450)} items)`);
  } catch (err) {
    console.warn('[Firestore] seed catalog failed:', err);
  }
}

/** Seed the SHARED request feed (admin overview / realtime). */
async function seedRequestsFeed(rows: BorrowRequest[]): Promise<void> {
  markSeedFlag(COLLECTIONS.requestsFeed);
  if (!rows.length) return;
  try {
    const batch = writeBatch(db!);
    const now = Date.now();
    rows.slice(0, 450).forEach((r, i) => {
      batch.set(
        doc(db!, COLLECTIONS.requestsFeed, r.id),
        clean({ ...r, createdAtMs: r.createdAtMs ?? now - i * 1000, updatedAtMs: now - i * 1000 }),
      );
    });
    await batch.commit();
    console.log(`[Firestore] seeded requests_feed (${Math.min(rows.length, 450)} requests)`);
  } catch (err) {
    console.warn('[Firestore] seed requests_feed failed:', err);
  }
}

const byNewest = <T extends { id: string }>(key: 'createdAtMs' | 'updatedAtMs') => (
  a: T,
  b: T,
): number =>
  (Number((b as unknown as Record<string, unknown>)[key]) || 0) -
  (Number((a as unknown as Record<string, unknown>)[key]) || 0);

/** Subscribe to a top-level collection (users / catalog / requests_feed). */
function subscribe<T extends { id: string }>(
  colName: string,
  seedFlag: string,
  lsKey: string,
  fallback: T[],
  onData: (rows: T[]) => void,
  onStatus: (s: FirestoreStatus) => void,
  sort?: (a: T, b: T) => number,
  seedFn?: (rows: T[]) => Promise<void>,
): Unsubscribe {
  return onSnapshot(
    collection(db!, colName),
    (snap) => {
      onStatus('online');
      let rows = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
      if (snap.empty && !hasSeedFlag(seedFlag)) {
        // Empty Firestore - seed from the localStorage cache or the initial mock data.
        const cached = readLocal<T>(lsKey);
        rows = cached.length ? cached : fallback;
        if (seedFn) void seedFn(rows);
        else markSeedFlag(seedFlag);
      }
      if (sort) rows = [...rows].sort(sort);
      onData(rows);
    },
    (err) => {
      console.warn(`[Firestore] sync "${colName}" failed (kept in localStorage):`, err.message);
      onStatus('offline');
    },
  );
}

/** Subscribe to a per-user subcollection (users/{uid}/{subCol}). Never seeds here. */
function subscribeUser<T extends { id: string }>(
  uid: string,
  subCol: string,
  onData: (rows: T[]) => void,
  onStatus: (s: FirestoreStatus) => void,
  sort?: (a: T, b: T) => number,
): Unsubscribe {
  return onSnapshot(
    collection(db!, COLLECTIONS.users, uid, subCol),
    (snap) => {
      onStatus('online');
      let rows = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
      if (sort) rows = [...rows].sort(sort);
      onData(rows);
    },
    (err) => {
      console.warn(`[Firestore] sync users/${uid}/${subCol} failed (kept in localStorage):`, err.message);
      onStatus('offline');
    },
  );
}

/**
 * Registers one realtime listener per collection. Returns an unsubscribe function.
 * Falls back to localStorage when Firestore is unavailable.
 */
export function subscribeAll(
  handlers: SyncHandlers,
  onStatus?: (s: FirestoreStatus) => void,
  scope?: SubscribeScope,
): Unsubscribe {
  const noop = () => {};
  const status = onStatus ?? noop;
  if (!isFirebaseReady || !db) {
    console.warn('[Firestore] not ready - using localStorage cache');
    status('offline');
    const cachedItems = readLocal<Item>(LS_KEYS.items);
    const cachedReqs = readLocal<BorrowRequest>(LS_KEYS.requests);
    const cachedNotifs = readLocal<LineNotification>(LS_KEYS.notifications);
    handlers.onUsers(readLocal<User>(LS_KEYS.users));
    handlers.onItems(cachedItems.length ? cachedItems : INITIAL_ITEMS);
    handlers.onRequests(cachedReqs.length ? cachedReqs : INITIAL_REQUESTS);
    handlers.onNotifications(cachedNotifs.length ? cachedNotifs : INITIAL_NOTIFICATIONS);
    return () => {};
  }

  const uid = scope?.userId;
  const unsubs: Unsubscribe[] = [
    subscribe<User>(COLLECTIONS.users, COLLECTIONS.users, LS_KEYS.users, [], handlers.onUsers, status, undefined, seedUsersAndPrivate),
    subscribe<Item>(COLLECTIONS.catalog, COLLECTIONS.catalog, LS_KEYS.items, INITIAL_ITEMS, handlers.onItems, status, byNewest('updatedAtMs'), seedCatalog),
    // Requests are read from the shared feed so every involved user (borrower,
    // item owner, admin) sees them in realtime; per-user copies are written below.
    subscribe<BorrowRequest>(COLLECTIONS.requestsFeed, COLLECTIONS.requestsFeed, LS_KEYS.requests, INITIAL_REQUESTS, handlers.onRequests, status, byNewest('createdAtMs'), seedRequestsFeed),
  ];

  if (uid) {
    // Notifications are private to each user - read ONLY from users/{uid}/notifications.
    unsubs.push(subscribeUser<LineNotification>(uid, COLLECTIONS.userNotifications, handlers.onNotifications, status, byNewest('updatedAtMs')));
  }

  return () => unsubs.forEach((u) => u());
}

function warn(scope: string, err: unknown): void {
  console.warn(`[Firestore] ${scope} failed (kept in localStorage):`, err);
}

/* ---------------- users : profiles (naturally per-user users/{userId}) ---------------- */
export async function saveUser(user: User): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.users, user.id), clean({ ...user, updatedAtMs: Date.now() }), { merge: true });
  } catch (err) {
    warn('save user', err);
  }
}

/* ---------------- items : SHARED catalog + per-owner copy ---------------- */
export async function saveItem(item: Item): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const data = clean({ ...item, updatedAtMs: Date.now() });
    await setDoc(doc(db, COLLECTIONS.catalog, item.id), data, { merge: true });
    if (item.ownerId) {
      await setDoc(doc(db, COLLECTIONS.users, item.ownerId, COLLECTIONS.userItems, item.id), data, { merge: true });
    }
  } catch (err) {
    warn('save item', err);
  }
}

export async function deleteItem(item: Item): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.catalog, item.id));
    if (item.ownerId) {
      await deleteDoc(doc(db, COLLECTIONS.users, item.ownerId, COLLECTIONS.userItems, item.id));
    }
  } catch (err) {
    warn('delete item', err);
  }
}

/* ---------------- borrow_requests : per-user copies + shared admin feed ---------------- */
export async function saveRequest(req: BorrowRequest): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const data = clean({ ...req, updatedAtMs: Date.now() });
    const refs = requestRefs(req);
    await Promise.all(refs.map((ref) => setDoc(ref, data, { merge: true })));
  } catch (err) {
    warn('save borrow request', err);
  }
}

export async function updateRequest(req: BorrowRequest, fields: Partial<BorrowRequest>): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const data = clean({ ...fields, updatedAtMs: Date.now() });
    const refs = requestRefs(req);
    await Promise.all(refs.map((ref) => setDoc(ref, data, { merge: true })));
  } catch (err) {
    warn('update borrow request', err);
  }
}

export async function deleteRequest(req: BorrowRequest): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const refs = requestRefs(req);
    await Promise.all(refs.map((ref) => deleteDoc(ref)));
  } catch (err) {
    warn('delete borrow request', err);
  }
}

/* ---------------- notifications : PRIVATE per-user only ---------------- */
export async function saveNotification(notif: LineNotification): Promise<void> {
  if (!isFirebaseReady || !db || !notif.recipientUserId) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.users, notif.recipientUserId, COLLECTIONS.userNotifications, notif.id),
      clean({ ...notif, updatedAtMs: Date.now() }),
      { merge: true },
    );
  } catch (err) {
    warn('save notification', err);
  }
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.users, userId, COLLECTIONS.userNotifications, id),
      { read: true, updatedAtMs: Date.now() },
      { merge: true },
    );
  } catch (err) {
    warn('mark notification read', err);
  }
}

export async function clearNotifications(userId: string): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.users, userId, COLLECTIONS.userNotifications));
    const batch = writeBatch(db);
    snap.docs.slice(0, 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    warn('clear notifications', err);
  }
}

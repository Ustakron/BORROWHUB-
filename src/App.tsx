/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { User, Item, BorrowRequest, LineNotification } from './types';
import {
  INITIAL_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  LINE_CHANNEL_CONFIG,
  BROKEN_ITEM_IMAGES,
  FOOTBALL_IMAGE_URL,
} from './data/mockData';
import { NavigationLayout } from './components/NavigationLayout';
import {
  subscribeAll,
  saveUser,
  saveItem,
  deleteItem,
  saveRequest,
  updateRequest,
  deleteRequest,
  saveNotification,
  markNotificationRead,
  clearNotifications,
} from './lib/db';
import { LandingHero } from './components/LandingHero';
import { DashboardOverview } from './components/DashboardOverview';
import { ItemCatalog } from './components/ItemCatalog';
import { RequestHistoryView } from './components/RequestHistoryView';
import { ProfileView } from './components/ProfileView';
import { LineLoginModal, RealLineProfile } from './components/LineLoginModal';
import { RegisterModal } from './components/RegisterModal';
import { LineFriendGate } from './components/LineFriendGate';
import { BorrowModal } from './components/BorrowModal';
import { LendingItemModal } from './components/LendingItemModal';
import { LinePushToast } from './components/LinePushToast';

export default function App() {
  // Persistent registered users (stored by LINE User ID)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('borrowhub_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Current authenticated user (NULL when not logged in - strictly NO mock/test accounts)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('borrowhub_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('borrowhub_items');
    const parsed: Item[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
    // Migrate cached items that still point to old broken image URLs
    // (รวมถึงรูปลูกฟุตบอล Molten ที่โหลดไม่ได้ในบางเบราว์เซอร์/เครือข่าย)
    return parsed.map((it) => {
      if (!it.image) return it;
      const isBroken = BROKEN_ITEM_IMAGES.some((broken) => it.image.includes(broken));
      return isBroken ? { ...it, image: FOOTBALL_IMAGE_URL } : it;
    });
  });

  const [requests, setRequests] = useState<BorrowRequest[]>(() => {
    const saved = localStorage.getItem('borrowhub_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [notifications, setNotifications] = useState<LineNotification[]>(() => {
    const saved = localStorage.getItem('borrowhub_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Map LINE user id to the app user id (users/{userId}) - per-user Firestore paths
  const userIdByLine = (lineId: string): string | undefined =>
    users.find((u) => u.lineUserId === lineId)?.id;

  // UI Flow & Navigation states
  const [currentTab, setCurrentTab] = useState<'home' | 'catalog' | 'requests' | 'notifications' | 'profile'>('home');
  const [showLineLoginModal, setShowLineLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingLineProfile, setPendingLineProfile] = useState<RealLineProfile | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBorrowItem, setSelectedBorrowItem] = useState<Item | null>(null);
  const [showLendingModal, setShowLendingModal] = useState(false);
  const [editingLendingItem, setEditingLendingItem] = useState<Item | null>(null);
  const [activePushToast, setActivePushToast] = useState<LineNotification | null>(null);
  const [showFriendGate, setShowFriendGate] = useState(false);
  const [friendGateUserId, setFriendGateUserId] = useState<string | null>(null);
  const [notifFriendStatus, setNotifFriendStatus] = useState<'checking' | 'friend' | 'not-friend' | 'error' | null>(null);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('borrowhub_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('borrowhub_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('borrowhub_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('borrowhub_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Firestore realtime sync — ข้อมูลแยก collection: users / items / borrow_requests / notifications
  // (ข้อมูลผู้ใช้อยู่ collection "users" ส่วนข้อมูลยืม-คืนอยู่ collection "borrow_requests")
  const [firestoreStatus, setFirestoreStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  useEffect(() => {
    if (!currentUser) return;
    return subscribeAll(
      {
        onUsers: (rows) => setUsers(rows),
        onItems: (rows) => setItems(rows),
        onRequests: (rows) => setRequests(rows),
        onNotifications: (rows) => setNotifications(rows),
      },
      (status) => setFirestoreStatus(status),
      { userId: currentUser.id, isAdmin: currentUser.role === 'admin' },
    );
  }, [currentUser?.id, currentUser?.role]);

  // Poll LINE OA friendship status when viewing Notifications tab
  useEffect(() => {
    if (currentTab === 'notifications' && currentUser?.lineUserId) {
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/line/friendship?userId=${encodeURIComponent(currentUser.lineUserId)}`);
          const data = await res.json().catch(() => null);
          if (!res.ok || !data || typeof data.isFriend !== 'boolean') {
            setNotifFriendStatus('error');
            return;
          }
          setNotifFriendStatus(data.isFriend ? 'friend' : 'not-friend');
        } catch {
          setNotifFriendStatus('error');
        }
      };
      checkStatus();
      const timer = setInterval(checkStatus, 3000);
      return () => clearInterval(timer);
    } else {
      setNotifFriendStatus(null);
    }
  }, [currentTab, currentUser?.lineUserId]);


  // Sync auth user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('borrowhub_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('borrowhub_auth_user');
    }
  }, [currentUser]);

  // Mobile same-tab login resume: after redirecting to LINE Login in the SAME
  // tab (phones / LINE in-app browser), the OAuth callback page navigates back
  // to `/?line_login=<base64url profile>`. Pick it up here, clean the URL,
  // and continue the normal login flow (existing user → home, new → register).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('line_login');
      if (!encoded) return;
      const json = decodeURIComponent(
        Array.prototype.map
          .call(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );
      const profile = JSON.parse(json) as RealLineProfile;
      if (profile && profile.userId) {
        try {
          sessionStorage.removeItem('borrowhub_line_login');
        } catch { /* ignore */ }
        // Clean the profile out of the address bar (it contains a LINE user ID).
        params.delete('line_login');
        const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', clean);
        handleLineLoginSuccess(profile);
      }
    } catch (err) {
      console.warn('[LINE login] cannot resume from redirect:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire-and-forget real LINE push via the api/line-push serverless function.
  // If the Channel Access Token is not configured yet, the serverless function
  // returns 503 and we only log it (in-app notifications still work).
  const sendLinePush = async (userId: string, title: string, message: string) => {
    try {
      const response = await fetch('/api/line/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.warn('[LINE push] ยังไม่ได้ส่งเข้า LINE:', data?.error || `HTTP ${response.status}`);
      } else {
        console.log('[LINE push] ส่งสําเร็จ ถึง LINE user', userId.slice(0, 6) + '…');
      }
    } catch (err) {
      console.warn('[LINE push] เกิดข้อผิดพลาดในการเชื่อมต่อ:', err);
    }
  };

  // In-app local notification only (no real LINE push)
  const notifyLocally = (notif: LineNotification) => {
    setNotifications((prev) => [notif, ...prev]);
    saveNotification(notif); // Firestore: notifications
    setActivePushToast(notif);
  };

  // Push notification trigger (in-app + real LINE Messaging API push)
  const triggerLinePush = (notif: LineNotification) => {
    notifyLocally(notif);

    // Also send the real LINE OA notification to the recipient's LINE account.
    if (notif.recipientLineId) {
      sendLinePush(notif.recipientLineId, notif.title, notif.message);
    }
  };

  // Force the user to add the LINE OA as a friend (when verifiable) before using the app.
  const gateOnFriendship = async (userId: string) => {
    try {
      const res = await fetch(`/api/line/friendship?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return; // token not configured yet -> skip quietly
      if (data.isFriend === false) {
        const warnNotif: LineNotification = {
          id: `notif-${Date.now()}`,
          title: 'ยังไม่ได้แอดเพื่อน LINE OA 💬',
          message: `กรุณาเพิ่มเพื่อน ${LINE_CHANNEL_CONFIG.oaName} เพื่อรับการแจ้งเตือนยืม-คืน\nลิงก์: ${LINE_CHANNEL_CONFIG.oaAddFriendUrl}`,
          type: 'system',
          timestamp: 'เมื่อสักครู่',
          read: false,
          recipientLineId: userId,
          recipientUserId: userIdByLine(userId),
        };
        setFriendGateUserId(userId);
        setShowFriendGate(true);
      }
    } catch {
      // best-effort only; never break the login flow
    }
  };

  // REAL LINE LOGIN SUCCESS HANDLER
  const handleLineLoginSuccess = (profile: RealLineProfile) => {
    setShowLineLoginModal(false);

    // Check if this real LINE user has registered in BORROW HUB
    const existing = users.find((u) => u.lineUserId === profile.userId);

    if (existing) {
      // User is already registered -> update their latest LINE avatar/display name if available
      const updatedUser: User = {
        ...existing,
        name: profile.displayName || existing.name,
        avatar: profile.pictureUrl || existing.avatar,
      };

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      saveUser(updatedUser);
      setCurrentUser(updatedUser);
      setCurrentTab('home');

      // Verify the returning user still follows the LINE OA (for real pushes).
      gateOnFriendship(updatedUser.lineUserId);

      const welcomeNotif: LineNotification = {
        id: `notif-${Date.now()}`,
        title: `เข้าสู่ระบบสำเร็จผ่าน LINE ✅`,
        message: `ยินดีต้อนรับคุณ ${updatedUser.name} (${profile.userId}) เข้าสู่ BORROW HUB โรงเรียนสระแก้ว`,
        type: 'system',
        timestamp: 'เมื่อสักครู่',
        read: false,
        recipientLineId: profile.userId,
        recipientUserId: updatedUser.id,
      };
      triggerLinePush(welcomeNotif);
    } else {
      // User is new -> Prompt registration (Step 5) with real LINE profile
      setPendingLineProfile(profile);
      setShowRegisterModal(true);
    }
  };

  // STEP 5: Register new user after real LINE authentication
  const handleRegisterSuccess = (newUser: User) => {
    setShowRegisterModal(false);
    setPendingLineProfile(null);
    setUsers((prev) => [...prev, newUser]);
    saveUser(newUser);
    setCurrentUser(newUser);
    setCurrentTab('home');

    gateOnFriendship(newUser.lineUserId);

    const welcomeNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `ลงทะเบียนสำเร็จ ยินดีต้อนรับ! 🎉`,
      message: `บัญชีของคุณ (${newUser.name} ${newUser.grade}/${newUser.room}) เชื่อมต่อกับ LINE บัญชีจริง (${newUser.lineUserId}) เรียบร้อยแล้ว`,
      type: 'system',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: newUser.lineUserId,
      recipientUserId: newUser.id,
    };
    triggerLinePush(welcomeNotif);
  };

  // Logout (Strictly returns to LINE Login landing)
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('borrowhub_auth_user');
  };

  // STEP 8: Create Borrow Request
  const handleOpenBorrowModal = (item: Item) => {
    setSelectedBorrowItem(item);
    setShowBorrowModal(true);
  };

  const handleSubmitBorrowRequest = (requestData: Omit<BorrowRequest, 'id' | 'createdAt' | 'status'>) => {
    if (!currentUser) return;

    const newId = `req-${Date.now().toString().slice(-4)}`;
    // Users that keep a per-user copy under users/{id}/borrow_requests:
    const ownerItem = items.find((i) => i.id === requestData.itemId);
    const ownerId = ownerItem?.ownerId;
    const readerUids: string[] = [];
    const addReader = (uid?: string) => {
      if (uid && !readerUids.includes(uid)) readerUids.push(uid);
    };
    addReader(currentUser.id);
    addReader(ownerId);
    users.filter((u) => u.role === 'admin').forEach((u) => addReader(u.id));
    const newReq: BorrowRequest = {
      ...requestData,
      id: newId,
      status: 'pending',
      createdAt: 'วันนี้ (เมื่อสักครู่)',
      createdAtMs: Date.now(),
      ownerId,
      readerUids,
    };

    setRequests((prev) => [newReq, ...prev]);
    saveRequest(newReq); // บันทึกคำขอยืมลง Firestore (collection: borrow_requests)
    setShowBorrowModal(false);

    // Step 9: แจ้งเตือนผู้ให้ยืมและผู้ยืมผ่าน LINE ทันที
    const pushMsg: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `ส่งคำขอยืม "${requestData.itemName}" แล้ว ⏳`,
      message: `คำขอของคุณสำหรับ ${requestData.borrowDate} (${requestData.borrowPeriod}) ส่งถึงผู้ดูแลแล้ว รอการพิจารณาอนุมัติ`,
      type: 'borrow_request',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: currentUser.lineUserId,
      recipientUserId: currentUser.id,
      relatedRequestId: newId,
    };
    triggerLinePush(pushMsg);
    setCurrentTab('requests');
  };

  // มีแค่คนที่ลงของสิ่งนั้น (เจ้าของของ ที่ item.ownerId ตรงกับ user id) เท่านั้นที่อนุมัติ/ปฏิเสธ
  // คำขอยืมของของตนเองได้ — admin (ครูผู้ดูแลระบบ) ยังดูแลของกลางของโรงเรียนได้ทุกราย
  const isRequestManager = (req: BorrowRequest): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const item = items.find((i) => i.id === req.itemId);
    return Boolean(item && item.ownerId && item.ownerId === currentUser.id);
  };

  // STEP 9: Approval Flow
  const handleApproveRequest = (requestId: string) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;
    // มีแค่เจ้าของของ (ผู้ที่ลงของนี้) เท่านั้นอนุมัติคำขอยืมของของตนเองได้
    if (!isRequestManager(target)) {
      window.alert('เฉพาะเจ้าของของ (ผู้ที่ลงของนี้) เท่านั้นสามารถอนุมัติคำขอยืมนี้');
      return;
    }

    // Update request status to 'borrowed'
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'borrowed',
              approvedAt: 'เมื่อสักครู่',
              approverName: currentUser.name,
            }
          : r
      )
    );
    updateRequest(target, {
      status: 'borrowed',
      approvedAt: 'เมื่อสักครู่',
      approverName: currentUser.name,
    }); // Firestore: borrow_requests

    // Update item status to 'borrowed'
    const targetItem = items.find((i) => i.id === target.itemId);
    const updatedItem: Item | undefined = targetItem
      ? {
          ...targetItem,
          status: 'borrowed',
          currentBorrowerName: target.borrowerName,
          currentBorrowerRoom: `${target.borrowerGrade}/${target.borrowerRoom}`,
          currentBorrowPeriod: target.borrowPeriod,
          currentDueDate: target.returnDate,
        }
      : undefined;
    if (updatedItem) {
      setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      saveItem(updatedItem); // Firestore: items
    }

    // Send LINE Push Notification to borrower (Step 9 in Image 1)
    const approveNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `คำขอยืมได้รับการอนุมัติแล้ว! ✅`,
      message: `คำขอยืม "${target.itemName}" ได้รับการอนุมัติแล้ว กรุณานำบัตรไปรับของที่ ${target.pickupLocation}`,
      type: 'approval',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      recipientUserId: target.borrowerId,
      relatedRequestId: requestId,
    };
    triggerLinePush(approveNotif);
  };

  const handleRejectRequest = (requestId: string, reason?: string) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;
    // มีแค่เจ้าของของ (ผู้ที่ลงของนี้) เท่านั้นปฏิเสธคำขอยืมของของตนเองได้
    if (!isRequestManager(target)) {
      window.alert('เฉพาะเจ้าของของ (ผู้ที่ลงของนี้) เท่านั้นสามารถปฏิเสธคำขอยืมนี้');
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason || 'อุปกรณ์ไม่พร้อมใช้งานหรือติดภารกิจส่วนกลาง',
            }
          : r
      )
    );
    updateRequest(target, {
      status: 'rejected',
      rejectionReason: reason || 'อุปกรณ์ไม่พร้อมใช้งานหรือติดภารกิจส่วนกลาง',
    }); // Firestore: borrow_requests

    const rejectNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `คำขอยืมไม่ได้รับการอนุมัติ ✕`,
      message: `คำขอยืม "${target.itemName}" ถูกปฏิเสธ เนื่องจาก: ${reason || 'ติดภารกิจส่วนกลาง'}`,
      type: 'rejection',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      recipientUserId: target.borrowerId,
      relatedRequestId: requestId,
    };
    triggerLinePush(rejectNotif);
  };

  // STEP 10: Return of item
  const handleReturnItem = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    // Update request
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'returned',
              returnedAt: 'เมื่อสักครู่',
            }
          : r
      )
    );
    updateRequest(target, { status: 'returned', returnedAt: 'เมื่อสักครู่' }); // Firestore: borrow_requests

    // Reset item status back to 'available'
    const targetItem = items.find((i) => i.id === target.itemId);
    const returnedItem: Item | undefined = targetItem
      ? {
          ...targetItem,
          status: 'available',
          currentBorrowerName: undefined,
          currentBorrowerRoom: undefined,
          currentBorrowPeriod: undefined,
          currentDueDate: undefined,
        }
      : undefined;
    if (returnedItem) {
      setItems((prev) => prev.map((i) => (i.id === returnedItem.id ? returnedItem : i)));
      saveItem(returnedItem); // Firestore: items
    }

    const returnNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `บันทึกการส่งคืนอุปกรณ์สำเร็จ ✨`,
      message: `คุณได้ส่งคืน "${target.itemName}" เรียบร้อยแล้ว ขอบคุณที่ร่วมดูแลรักษาของโรงเรียนสระแก้ว`,
      type: 'returned',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      recipientUserId: target.borrowerId,
      relatedRequestId: requestId,
    };
    triggerLinePush(returnNotif);
  };

  // STEP 10: Overdue simulation
  const handleSimulateOverdue = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'overdue' } : r))
    );
    updateRequest(target, { status: 'overdue' }); // Firestore: borrow_requests

    const overdueNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `⚠️ แจ้งเตือนเกินกำหนดส่งคืน (OVERDUE)!`,
      message: `รายการยืม "${target.itemName}" เกินกำหนดเวลาแล้ว กรุณานำส่งคืนที่ ${target.returnLocation} โดยด่วน!`,
      type: 'overdue',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      recipientUserId: target.borrowerId,
      relatedRequestId: requestId,
    };
    triggerLinePush(overdueNotif);
  };

  // STEP 10: Reminder simulation
  const handleSimulateReminder = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    const reminderNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `⏰ แจ้งเตือนก่อนถึงกำหนดคืน (Reminder)`,
      message: `เหลือเวลาอีกประมาณ 15 นาทีก่อนสิ้นสุด ${target.returnPeriod} สำหรับการคืน "${target.itemName}"`,
      type: 'reminder',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      recipientUserId: target.borrowerId,
      relatedRequestId: requestId,
    };
    triggerLinePush(reminderNotif);
  };

  // เพิ่ม/แก้ไขของที่ให้ยืม — ทุกคน (นักเรียน / ครู) เพิ่มของตนเองได้
  const handleSaveItem = (savedItem: Item) => {
    if (!currentUser) return;
    const exists = items.some((i) => i.id === savedItem.id);

    if (exists) {
      setItems((prev) => prev.map((i) => (i.id === savedItem.id ? savedItem : i)));
      // อัปเดตรูป/ชื่อในคำขอยืมที่ยัง pending ด้วย
      setRequests((prev) =>
        prev.map((r) =>
          r.itemId === savedItem.id && r.status === 'pending'
            ? { ...r, itemName: savedItem.name, itemImage: savedItem.image, itemCategory: savedItem.categoryLabel }
            : r,
        ),
      );
    } else {
      setItems((prev) => [savedItem, ...prev]);
    }
    saveItem(savedItem); // Firestore: items
    // อัปเดตคำขอยืมที่ยัง pending ของของนี้ใน Firestore ด้วย
    requests
      .filter((r) => r.itemId === savedItem.id && r.status === 'pending')
      .forEach((r) =>
        updateRequest(r, {
          itemName: savedItem.name,
          itemImage: savedItem.image,
          itemCategory: savedItem.categoryLabel,
        }),
      );

    const notif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: exists ? `แก้ไขข้อมูลของที่ให้ยืมแล้ว: ${savedItem.name}` : `เพิ่มของให้ยืมใหม่แล้ว: ${savedItem.name}`,
      message: exists
        ? `แก้ไขข้อมูลของ "${savedItem.name}" เรียบร้อยแล้ว หมวดหมู่ ${savedItem.categoryLabel}`
        : `${currentUser.name} เพิ่มของ "${savedItem.name}" หมวดหมู่ ${savedItem.categoryLabel} จุดรับคืน ${savedItem.location} เข้าระบบ BORROW HUB แล้ว`,
      type: 'system',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: currentUser.lineUserId,
      recipientUserId: currentUser.id,
    };
    triggerLinePush(notif);
  };

  // ลบของที่ให้ยืม — เจ้าของของ หรือ admin เท่านั้น (และต้องไม่มีผู้ยืมอยู่)
  const handleDeleteItem = (item: Item) => {
    if (!currentUser) return;
    const target = items.find((i) => i.id === item.id);
    if (!target) return;
    const canDelete =
      currentUser.role === 'admin' || (target.ownerId && target.ownerId === currentUser.id);
    if (!canDelete) {
      window.alert('คุณสามารถลบได้เฉพาะของของคุณเองเท่านั้น');
      return;
    }
    if (target.status === 'borrowed') {
      window.alert('ลบของไม่ได้ขณะที่มีผู้ยืมอยู่ กรุณารอผู้ยืมส่งคืนก่อน');
      return;
    }
    if (!window.confirm(`ยืนยันลบของ "${target.name}" ออกจากระบบ BORROW HUB?`)) return;

    setItems((prev) => prev.filter((i) => i.id !== target.id));
    // ลบคำขอยืมที่ยังรออนุมัติของของนี้ด้วย
    setRequests((prev) => prev.filter((r) => !(r.itemId === target.id && r.status === 'pending')));
    deleteItem(target); // Firestore: items
    requests
      .filter((r) => r.itemId === target.id && r.status === 'pending')
      .forEach((r) => deleteRequest(r)); // Firestore: borrow_requests

    const notif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `ลบของที่ให้ยืมแล้ว: ${target.name}`,
      message: `ของ "${target.name}" ถูกลบออกจากระบบ BORROW HUB เรียบร้อยแล้ว`,
      type: 'system',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: currentUser.lineUserId,
      recipientUserId: currentUser.id,
    };
    triggerLinePush(notif);
  };

  // Notifications helpers
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationRead(id, currentUser.id); // Firestore: notifications
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    clearNotifications(currentUser.id); // Firestore: notifications
  };

  // STEP 1: If not logged in, render the Landing Hero requiring real LINE Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <LandingHero onStartLineLogin={() => setShowLineLoginModal(true)} />

        <LineLoginModal
          isOpen={showLineLoginModal}
          onClose={() => setShowLineLoginModal(false)}
          onSuccess={handleLineLoginSuccess}
        />

        <RegisterModal
          isOpen={showRegisterModal}
          lineProfile={pendingLineProfile}
          onRegisterSuccess={handleRegisterSuccess}
          onClose={() => {
            setShowRegisterModal(false);
            setPendingLineProfile(null);
          }}
        />

      </div>
    );
  }

  // Active user filtered requests
  // ผู้ใช้ทั่วไปเห็น: (1) คำขอยืมที่ตัวเป็นผู้ยืม และ (2) คำขอยืมของของที่ตัวเป็นเจ้าของ (เพื่ออนุมัติ/ปฏิเสธ)
  const userRequests =
    currentUser.role === 'admin'
      ? requests
      : requests.filter(
          (r) =>
            r.borrowerId === currentUser.id ||
            r.borrowerLineId === currentUser.lineUserId ||
            isRequestManager(r),
        );

  const activeBorrows = userRequests.filter(
    (r) => r.status === 'borrowed' || r.status === 'overdue'
  );
  const pendingRequests = userRequests.filter((r) => r.status === 'pending');
  const overdueRequests = userRequests.filter((r) => r.status === 'overdue');

  return (
    <NavigationLayout
      currentTab={currentTab}
      onSelectTab={(tab) => setCurrentTab(tab)}
      currentUser={currentUser}
      onLogout={handleLogout}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onClearNotifications={handleClearNotifications}
      onSelectRequestFromNotif={(reqId) => {
        setCurrentTab('requests');
      }}
    >
      {/* Tab: Dashboard Overview (Step 4 & 6) */}
      {currentTab === 'home' && (
        <DashboardOverview
          currentUser={currentUser}
          activeBorrows={activeBorrows}
          pendingRequests={pendingRequests}
          overdueRequests={overdueRequests}
          allItems={items}
          onNavigateToCatalog={() => setCurrentTab('catalog')}
          onNavigateToRequests={() => setCurrentTab('requests')}
          onReturnItem={handleReturnItem}
          onSimulateOverdue={handleSimulateOverdue}
          onQuickBorrow={handleOpenBorrowModal}
        />
      )}

      {/* Tab: Item Catalog (Step 7) */}
      {currentTab === 'catalog' && (
        <ItemCatalog
          items={items}
          onSelectItemForBorrow={handleOpenBorrowModal}
          onAddItem={() => {
            setEditingLendingItem(null);
            setShowLendingModal(true);
          }}
          onEditItem={(item) => {
            setEditingLendingItem(item);
            setShowLendingModal(true);
          }}
          onDeleteItem={handleDeleteItem}
          currentUser={currentUser}
          isAdmin={currentUser.role === 'admin'}
        />
      )}

      {/* Tab: Requests & Approvals (Step 8, 9, 10) */}
      {currentTab === 'requests' && (
        <RequestHistoryView
          requests={userRequests}
          currentUser={currentUser}
          canManageRequest={isRequestManager}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onReturnRequest={handleReturnItem}
          onSimulateOverdue={handleSimulateOverdue}
          onSimulateReminder={handleSimulateReminder}
        />
      )}

      {/* Tab: Notifications log */}
      {currentTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#1B365D]">ประวัติการแจ้งเตือน LINE</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ข้อความที่ส่งไปยัง LINE Official Account ({LINE_CHANNEL_CONFIG.channelName})
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearNotifications}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                ยังไม่มีการแจ้งเตือน
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkNotificationRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    notif.type === 'overdue'
                      ? 'bg-red-50 border-red-200 text-red-950'
                      : notif.type === 'approval'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : notif.type === 'rejection'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200'
                  } ${!notif.read ? 'ring-2 ring-[#06C755]/30 font-medium' : 'opacity-85'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06C755]"></span>
                      <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed pl-4">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {currentTab === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            saveUser(updated); // Firestore: users
          }}
          userRequests={userRequests}
        />
      )}

      {/* Modals */}
      <LineLoginModal
        isOpen={showLineLoginModal}
        onClose={() => setShowLineLoginModal(false)}
        onSuccess={handleLineLoginSuccess}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        lineProfile={pendingLineProfile}
        onRegisterSuccess={handleRegisterSuccess}
        onClose={() => {
          setShowRegisterModal(false);
          setPendingLineProfile(null);
        }}
      />

      <BorrowModal
        isOpen={showBorrowModal}
        item={selectedBorrowItem}
        currentUser={currentUser}
        onClose={() => {
          setShowBorrowModal(false);
          setSelectedBorrowItem(null);
        }}
        onSubmit={handleSubmitBorrowRequest}
      />

      <LendingItemModal
        isOpen={showLendingModal}
        onClose={() => {
          setShowLendingModal(false);
          setEditingLendingItem(null);
        }}
        onSave={handleSaveItem}
        currentUser={currentUser}
        editingItem={editingLendingItem}
      />

            {/* LINE OA friend gate: blocks until the user adds the OA as friend */}
      <LineFriendGate
        isOpen={showFriendGate}
        userId={friendGateUserId}
        oaName={LINE_CHANNEL_CONFIG.oaName}
        oaAddFriendUrl={LINE_CHANNEL_CONFIG.oaAddFriendUrl}
        onFriendConfirmed={() => setShowFriendGate(false)}
        onDegraded={() => setShowFriendGate(false)}
      />

      {/* Floating LINE Push Toast */}
      <LinePushToast
        notification={activePushToast}
        onClose={() => setActivePushToast(null)}
        onClick={(reqId) => {
          setActivePushToast(null);
          setCurrentTab('requests');
        }}
      />
    </NavigationLayout>
  );
}

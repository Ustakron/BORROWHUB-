/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Item, BorrowRequest, LineNotification } from './types';
import {
  INITIAL_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  LINE_CHANNEL_CONFIG,
} from './data/mockData';
import { NavigationLayout } from './components/NavigationLayout';
import { LandingHero } from './components/LandingHero';
import { DashboardOverview } from './components/DashboardOverview';
import { ItemCatalog } from './components/ItemCatalog';
import { RequestHistoryView } from './components/RequestHistoryView';
import { ProfileView } from './components/ProfileView';
import { LineLoginModal, RealLineProfile } from './components/LineLoginModal';
import { RegisterModal } from './components/RegisterModal';
import { BorrowModal } from './components/BorrowModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { AddItemModal } from './components/AddItemModal';
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
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [requests, setRequests] = useState<BorrowRequest[]>(() => {
    const saved = localStorage.getItem('borrowhub_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [notifications, setNotifications] = useState<LineNotification[]>(() => {
    const saved = localStorage.getItem('borrowhub_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // UI Flow & Navigation states
  const [currentTab, setCurrentTab] = useState<'home' | 'catalog' | 'requests' | 'notifications' | 'profile'>('home');
  const [showLineLoginModal, setShowLineLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingLineProfile, setPendingLineProfile] = useState<RealLineProfile | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBorrowItem, setSelectedBorrowItem] = useState<Item | null>(null);
  const [showSystemInfoModal, setShowSystemInfoModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [activePushToast, setActivePushToast] = useState<LineNotification | null>(null);

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

  // Sync auth user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('borrowhub_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('borrowhub_auth_user');
    }
  }, [currentUser]);

  // Push notification trigger
  const triggerLinePush = (notif: LineNotification) => {
    setNotifications((prev) => [notif, ...prev]);
    setActivePushToast(notif);
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
      setCurrentUser(updatedUser);
      setCurrentTab('home');

      const welcomeNotif: LineNotification = {
        id: `notif-${Date.now()}`,
        title: `เข้าสู่ระบบสำเร็จผ่าน LINE ✅`,
        message: `ยินดีต้อนรับคุณ ${updatedUser.name} (${profile.userId}) เข้าสู่ BORROW HUB โรงเรียนสระแก้ว`,
        type: 'system',
        timestamp: 'เมื่อสักครู่',
        read: false,
        recipientLineId: profile.userId,
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
    setCurrentUser(newUser);
    setCurrentTab('home');

    const welcomeNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `ลงทะเบียนสำเร็จ ยินดีต้อนรับ! 🎉`,
      message: `บัญชีของคุณ (${newUser.name} ${newUser.grade}/${newUser.room}) เชื่อมต่อกับ LINE บัญชีจริง (${newUser.lineUserId}) เรียบร้อยแล้ว`,
      type: 'system',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: newUser.lineUserId,
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
    const newReq: BorrowRequest = {
      ...requestData,
      id: newId,
      status: 'pending',
      createdAt: 'วันนี้ (เมื่อสักครู่)',
    };

    setRequests((prev) => [newReq, ...prev]);
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
      relatedRequestId: newId,
    };
    triggerLinePush(pushMsg);
    setCurrentTab('requests');
  };

  // STEP 9: Approval Flow
  const handleApproveRequest = (requestId: string) => {
    if (!currentUser) return;
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

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

    // Update item status to 'borrowed'
    setItems((prev) =>
      prev.map((i) =>
        i.id === target.itemId
          ? {
              ...i,
              status: 'borrowed',
              currentBorrowerName: target.borrowerName,
              currentBorrowerRoom: `${target.borrowerGrade}/${target.borrowerRoom}`,
              currentBorrowPeriod: target.borrowPeriod,
              currentDueDate: target.returnDate,
            }
          : i
      )
    );

    // Send LINE Push Notification to borrower (Step 9 in Image 1)
    const approveNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `คำขอยืมได้รับการอนุมัติแล้ว! ✅`,
      message: `คำขอยืม "${target.itemName}" ได้รับการอนุมัติแล้ว กรุณานำบัตรไปรับของที่ ${target.pickupLocation}`,
      type: 'approval',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
      relatedRequestId: requestId,
    };
    triggerLinePush(approveNotif);
  };

  const handleRejectRequest = (requestId: string, reason?: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

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

    const rejectNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `คำขอยืมไม่ได้รับการอนุมัติ ✕`,
      message: `คำขอยืม "${target.itemName}" ถูกปฏิเสธ เนื่องจาก: ${reason || 'ติดภารกิจส่วนกลาง'}`,
      type: 'rejection',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
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

    // Reset item status back to 'available'
    setItems((prev) =>
      prev.map((i) =>
        i.id === target.itemId
          ? {
              ...i,
              status: 'available',
              currentBorrowerName: undefined,
              currentBorrowerRoom: undefined,
              currentBorrowPeriod: undefined,
              currentDueDate: undefined,
            }
          : i
      )
    );

    const returnNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `บันทึกการส่งคืนอุปกรณ์สำเร็จ ✨`,
      message: `คุณได้ส่งคืน "${target.itemName}" เรียบร้อยแล้ว ขอบคุณที่ร่วมดูแลรักษาของโรงเรียนสระแก้ว`,
      type: 'returned',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
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

    const overdueNotif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `⚠️ แจ้งเตือนเกินกำหนดส่งคืน (OVERDUE)!`,
      message: `รายการยืม "${target.itemName}" เกินกำหนดเวลาแล้ว กรุณานำส่งคืนที่ ${target.returnLocation} โดยด่วน!`,
      type: 'overdue',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: target.borrowerLineId,
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
      relatedRequestId: requestId,
    };
    triggerLinePush(reminderNotif);
  };

  const handleAddItem = (newItem: Item) => {
    if (!currentUser) return;
    setItems((prev) => [newItem, ...prev]);
    const notif: LineNotification = {
      id: `notif-${Date.now()}`,
      title: `เพิ่มอุปกรณ์ใหม่: ${newItem.name}`,
      message: `เพิ่มเข้าระบบ BORROW HUB หมวดหมู่ ${newItem.categoryLabel} เรียบร้อยแล้ว`,
      type: 'system',
      timestamp: 'เมื่อสักครู่',
      read: false,
      recipientLineId: currentUser.lineUserId,
    };
    triggerLinePush(notif);
  };

  // Notifications helpers
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // STEP 1: If not logged in, render the Landing Hero requiring real LINE Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <LandingHero
          onStartLineLogin={() => setShowLineLoginModal(true)}
          onOpenSystemInfo={() => setShowSystemInfoModal(true)}
        />

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

        <SystemInfoModal
          isOpen={showSystemInfoModal}
          onClose={() => setShowSystemInfoModal(false)}
        />
      </div>
    );
  }

  // Active user filtered requests
  const userRequests =
    currentUser.role === 'admin'
      ? requests
      : requests.filter((r) => r.borrowerId === currentUser.id || r.borrowerLineId === currentUser.lineUserId);

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
      onOpenSystemInfo={() => setShowSystemInfoModal(true)}
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
          onAddItem={() => setShowAddItemModal(true)}
          isAdmin={currentUser.role === 'admin'}
        />
      )}

      {/* Tab: Requests & Approvals (Step 8, 9, 10) */}
      {currentTab === 'requests' && (
        <RequestHistoryView
          requests={userRequests}
          currentUser={currentUser}
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

      <SystemInfoModal
        isOpen={showSystemInfoModal}
        onClose={() => setShowSystemInfoModal(false)}
      />

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItem}
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

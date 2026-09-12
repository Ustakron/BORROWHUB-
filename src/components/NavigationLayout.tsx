import React, { useState } from 'react';
import { BorrowHubLogo } from './BorrowHubLogo';
import { User, LineNotification } from '../types';
import { LineNotificationCenter } from './LineNotificationCenter';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import {
  Home,
  Package,
  FileText,
  Bell,
  UserCheck,
  LogOut,
  Info,
  Menu,
  X,
  ShieldAlert,
  GraduationCap,
  Users,
} from 'lucide-react';

interface NavigationLayoutProps {
  currentTab: 'home' | 'catalog' | 'requests' | 'notifications' | 'profile';
  onSelectTab: (tab: 'home' | 'catalog' | 'requests' | 'notifications' | 'profile') => void;
  currentUser: User;
  onLogout: () => void;
  onOpenSystemInfo: () => void;
  notifications: LineNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onSelectRequestFromNotif: (requestId: string) => void;
  children: React.ReactNode;
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenSystemInfo,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onSelectRequestFromNotif,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  interface NavItem {
    id: 'home' | 'catalog' | 'requests' | 'notifications' | 'profile';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'catalog', label: 'รายการของ', icon: Package },
    { id: 'requests', label: 'คำขอยืม', icon: FileText },
    { id: 'notifications', label: 'แจ้งเตือน', icon: Bell, badge: unreadNotifCount },
    { id: 'profile', label: 'โปรไฟล์', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar for Desktop (matching Image 1 Step 4) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 sticky top-0 h-screen z-30 justify-between">
        <div>
          {/* Logo with Navy and Orange from Image 2 */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <BorrowHubLogo size="sm" variant="horizontal" showSubtext={true} />
          </div>

          {/* Navigation Menu Links (Matching Image 1: หน้าหลัก, รายการของ, คำขอยืม, แจ้งเตือน, โปรไฟล์) */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1B365D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F26522]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#06C755] text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-100">
              <button
                onClick={onOpenSystemInfo}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-orange-50 hover:text-[#F26522] transition-colors"
              >
                <Info className="w-4 h-4 text-[#F26522]" />
                <span>โครงสร้างระบบ (Step 11 & 12)</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom User Card (Real LINE Account) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#06C755] border-2 border-white rounded-full"></span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span>{currentUser.grade} {currentUser.room ? `/${currentUser.room}` : ''}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#06C755] font-semibold">LINE Login</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="ออกจากระบบ"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/90 px-4 md:px-8 py-3.5 sticky top-0 z-20 flex items-center justify-between shadow-2xs">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BorrowHubLogo size="sm" variant="horizontal" showSubtext={false} />
          </div>

          {/* Desktop school title */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-[#1B365D]">{LINE_CHANNEL_CONFIG.schoolName}</span>
            <span>•</span>
            <span>ระบบศูนย์กลางการยืม-ให้ยืมสิ่งของภายในโรงเรียน</span>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Quick System Info button */}
            <button
              onClick={onOpenSystemInfo}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F26522] text-xs font-semibold border border-orange-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>ภาพรวมระบบ (12 ขั้นตอน)</span>
            </button>

            {/* Simulated LINE Notification Center */}
            <LineNotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkNotificationRead}
              onClearAll={onClearNotifications}
              onSelectRequest={onSelectRequestFromNotif}
            />

            {/* Mobile User Avatar */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="md:hidden w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-[#1B365D] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#06C755] text-white text-[10px]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  onOpenSystemInfo();
                  setMobileMenuOpen(false);
                }}
                className="text-[#F26522] font-semibold flex items-center gap-1.5 py-1"
              >
                <Info className="w-4 h-4" />
                <span>ดู 12 ขั้นตอนตามภาพ</span>
              </button>
              <button
                onClick={onLogout}
                className="text-rose-600 font-semibold flex items-center gap-1 py-1"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

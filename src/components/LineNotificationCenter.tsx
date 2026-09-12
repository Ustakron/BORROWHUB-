import React, { useState } from 'react';
import { LineNotification } from '../types';
import { Bell, CheckCheck, Clock, AlertTriangle, MessageCircle, X, ChevronRight } from 'lucide-react';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';

interface LineNotificationCenterProps {
  notifications: LineNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectRequest?: (requestId: string) => void;
}

export const LineNotificationCenter: React.FC<LineNotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectRequest,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: LineNotification['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCheck className="w-4 h-4 text-emerald-600" />;
      case 'rejection':
        return <X className="w-4 h-4 text-rose-600" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />;
      case 'borrow_request':
        return <MessageCircle className="w-4 h-4 text-[#06C755]" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeStyle = (type: LineNotification['type']) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'approval':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'rejection':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'reminder':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors flex items-center gap-2"
        title="การแจ้งเตือน LINE"
      >
        <div className="relative">
          <Bell className="w-5 h-5 text-[#1B365D]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#06C755] text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="hidden md:inline text-xs font-semibold text-slate-700">
          LINE แจ้งเตือน
        </span>
      </button>

      {/* Popover Notification Center */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="bg-[#06C755] px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white text-[#06C755] font-black text-xs flex items-center justify-center">
                  LINE
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">LINE Official Account</h4>
                  <p className="text-[10px] text-white/90">{LINE_CHANNEL_CONFIG.channelName} • โรงเรียนสระแก้ว</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[11px] text-white/80 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/15 transition-colors"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification items */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  ไม่มีการแจ้งเตือนในขณะนี้
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      if (notif.relatedRequestId && onSelectRequest) {
                        onSelectRequest(notif.relatedRequestId);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl mb-1.5 transition-all cursor-pointer border ${getBadgeStyle(
                      notif.type
                    )} ${!notif.read ? 'ring-1 ring-[#06C755]/50' : 'opacity-90'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-xs truncate text-slate-900">
                            {notif.title}
                          </h5>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#06C755] shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                          <span>{notif.timestamp}</span>
                          <span className="text-[#1B365D] font-medium flex items-center gap-0.5 hover:underline">
                            ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-2.5 border-t border-slate-100 text-center text-[10px] text-slate-500">
              ข้อความแจ้งเตือนอัตโนมัติผ่าน LINE Messaging API
            </div>
          </div>
        </>
      )}
    </div>
  );
};

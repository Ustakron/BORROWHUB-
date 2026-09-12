import React, { useEffect } from 'react';
import { LineNotification } from '../types';
import { X, ChevronRight, MessageSquare } from 'lucide-react';

interface LinePushToastProps {
  notification: LineNotification | null;
  onClose: () => void;
  onClick: (requestId?: string) => void;
}

export const LinePushToast: React.FC<LinePushToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top duration-300">
      <div
        onClick={() => onClick(notification.relatedRequestId)}
        className="cursor-pointer bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 hover:bg-slate-900 transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06C755] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            LINE
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#06C755] uppercase tracking-wider">
                LINE Official Account • BORROW HUB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="font-bold text-xs text-white mt-1 truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
              <span>{notification.timestamp}</span>
              <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                แตะเพื่อดูรายละเอียด <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

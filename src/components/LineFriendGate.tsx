import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, MessageCircle } from 'lucide-react';
import { BorrowHubLogo } from './BorrowHubLogo';

interface LineFriendGateProps {
  isOpen: boolean;
  userId: string | null;
  oaName: string;
  oaAddFriendUrl: string;
  /** Called when the system confirms the user IS a friend of the OA. */
  onFriendConfirmed: () => void;
  /** Called when friendship cannot be verified (degraded mode, e.g. no token). */
  onDegraded: () => void;
}

/**
 * Full-screen blocker that requires the LINE user to add the LINE OA as a
 * friend before the app can be used. Auto-checks friendship every 3 seconds.
 */
export const LineFriendGate: React.FC<LineFriendGateProps> = ({
  isOpen,
  userId,
  oaName,
  oaAddFriendUrl,
  onFriendConfirmed,
  onDegraded,
}) => {
  const [status, setStatus] = useState<'checking' | 'friend' | 'not-friend'>('checking');

  const checkStatus = async () => {
    if (!userId) {
      onDegraded();
      return;
    }
    try {
      const res = await fetch(`/api/line/friendship?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data.isFriend !== 'boolean') {
        // Cannot verify (token not configured / channel not linked) → allow use.
        onDegraded();
        return;
      }
      if (data.isFriend === true) {
        setStatus('friend');
        onFriendConfirmed();
      } else {
        setStatus('not-friend');
      }
    } catch {
      onDegraded();
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      setStatus('checking');
      checkStatus();
      const timer = setInterval(checkStatus, 3000);
      return () => clearInterval(timer);
    }
    setStatus('checking');
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F2444]/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-[#1B365D]/5 to-transparent border-b border-slate-100 flex items-center gap-3">
          <BorrowHubLogo size="sm" variant="icon" />
          <div>
            <h3 className="font-bold text-[#1B365D] text-base">BORROW HUB</h3>
            <p className="text-xs text-slate-500">ต้องเพิ่มเพื่อน LINE OA ก่อนใช้งานขั้นที่ 1/2</p>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#06C755] text-white text-2xl font-black flex items-center justify-center">
              LINE
            </div>
            <h4 className="text-lg font-bold text-[#1B365D] mt-3">
              เพิ่มเพื่อน {oaName} เพื่อรับการแจ้งเตือน
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ระบบต้องการเพื่อรับข้อแจ้งเตือนสถานะ ยืม/คืน/อนุมัติ ที่ต้องผ่าน LINE Official Account
              หากไม่แอดเพื่อน ระบบยังใช้เว็บต่อไม่ได้
            </p>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              status === 'friend' ? 'bg-emerald-50 border-emerald-300' : 'bg-[#06C755]/5 border-[#06C755]/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 text-white ${status === 'friend' ? 'bg-emerald-600' : 'bg-[#06C755]'}`}>
                {status === 'friend' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {status === 'friend'
                    ? `แอดเพื่อน ${oaName} แล้ว 🎉`
                    : `ยังไม่ได้แอดเพื่อน ${oaName} ยัง`}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {status === 'friend'
                    ? 'กำลังเปิด BORROW HUB...'
                    : status === 'checking'
                    ? 'กำลังตรวจสอบสถานะเพื่อน...'
                    : Open LINE and tap "เพิ่มเพื่อน" — ระบบจะตรวจสอบอัตโนมัติทุก 3 วินาที}
                </p>
              </div>
            </div>

            {status === 'not-friend' && (
              <a
                href={oaAddFriendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                เปิด LINE แล้วเพิ่มเพื่อน {oaName}
              </a>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            After adding the friend in LINE, this screen unlocks automatically (checks every 3 seconds).
          </p>
        </div>
      </div>
    </div>
  );
};
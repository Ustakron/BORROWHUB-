import React, { useState, useEffect } from 'react';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import { ExternalLink, ShieldCheck, AlertCircle, X, CheckCircle2, Lock, Smartphone, Copy, Check } from 'lucide-react';
import { BorrowHubLogo } from './BorrowHubLogo';

export interface RealLineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

interface LineLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: RealLineProfile) => void;
}

export const LineLoginModal: React.FC<LineLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [waitingForPopup, setWaitingForPopup] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Determine the exact callback URL
  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://ais-dev-rxpxscperwipjylkq5ihsn-761058197384.asia-southeast1.run.app/auth/callback';

  // Fetch real LINE OAuth authorization URL from backend
  const fetchAuthUrl = async () => {
    setLoadingUrl(true);
    setLoginError(null);
    try {
      const response = await fetch(`/api/auth/line/url?redirect_uri=${encodeURIComponent(callbackUrl)}`);
      if (!response.ok) {
        throw new Error('ไม่สามารถสร้าง URL สำหรับ LINE Login ได้');
      }
      const data = await response.json();
      setAuthUrl(data.url);
      return data.url;
    } catch (err: any) {
      console.error('Fetch LINE URL error:', err);
      setLoginError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      return null;
    } finally {
      setLoadingUrl(false);
    }
  };

  // Open the real LINE Login OAuth window
  const openLineLoginPopup = async (urlToOpen?: string) => {
    const targetUrl = urlToOpen || authUrl || (await fetchAuthUrl());
    if (!targetUrl) return;

    setWaitingForPopup(true);
    setLoginError(null);

    const width = 500;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      targetUrl,
      'line_oauth_window',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=1`
    );

    if (!popup) {
      setLoginError('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปหรือคลิกปุ่มเปิดหน้าต่างด้านล่าง');
    }
  };

  // When modal opens, immediately prepare and launch popup
  useEffect(() => {
    if (isOpen) {
      fetchAuthUrl().then((url) => {
        if (url) {
          openLineLoginPopup(url);
        }
      });
    } else {
      setWaitingForPopup(false);
      setLoginError(null);
    }
  }, [isOpen]);

  // Listen for real postMessage from callback popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if needed
      if (event.data?.type === 'LINE_LOGIN_SUCCESS') {
        setWaitingForPopup(false);
        const profile: RealLineProfile = event.data.user;
        onSuccess(profile);
      } else if (event.data?.type === 'LINE_LOGIN_ERROR') {
        setWaitingForPopup(false);
        setLoginError(event.data.error || 'การเข้าสู่ระบบผ่าน LINE ไม่สำเร็จ');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* LINE Green Header */}
        <div className="bg-[#06C755] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-[#06C755] font-black flex items-center justify-center text-xs shadow-xs">
              LINE
            </div>
            <div>
              <span className="font-bold text-base block">เข้าสู่ระบบด้วย LINE</span>
              <span className="text-[10px] text-white/90">LINE Login • บัญชีผู้ใช้งาน</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Logo & School context */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs mb-2">
              <BorrowHubLogo size="sm" variant="icon" />
            </div>
            <h3 className="text-lg font-bold text-[#1B365D]">BORROW HUB โรงเรียนสระแก้ว</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบยืม-คืนอุปกรณ์และสิ่งของสำหรับนักเรียนและบุคลากร
            </p>
          </div>

          {/* Status view */}
          {waitingForPopup ? (
            <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200/80 text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full border-3 border-emerald-500/30 border-t-[#06C755] animate-spin flex items-center justify-center"></div>
              <h4 className="text-sm font-bold text-emerald-950 mb-1">
                กำลังรอการยืนยันตัวตนจาก LINE...
              </h4>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                กรุณาเข้าสู่ระบบในหน้าต่างป๊อปอัปของ LINE หรือสแกน QR Code เพื่อเข้าใช้งาน
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#06C755]" />
                <span>การเชื่อมต่อบัญชี LINE:</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 pl-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ดึงข้อมูลชื่อและรูปโปรไฟล์เพื่อสร้างข้อมูลสมาชิก</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 pl-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>รับการแจ้งเตือนสถานะการยืม-คืนผ่าน LINE โดยตรง</span>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {loginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">เกิดข้อผิดพลาด</p>
                <p className="mt-0.5">{loginError}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={loadingUrl}
              onClick={() => openLineLoginPopup()}
              className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-2xl shadow-lg shadow-[#06C755]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {waitingForPopup ? 'เปิดหน้าต่าง LINE Login อีกครั้ง' : 'เข้าสู่ระบบด้วย LINE'}
              </span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
          </div>

          {/* Callback URL config note for LINE Developers Console */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="text-[11px] text-slate-500 mb-1.5 font-medium">
              Callback URL สำหรับลงทะเบียนใน LINE Developers Console:
            </div>
            <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-700">
              <span className="truncate">{callbackUrl}</span>
              <button
                onClick={handleCopyCallback}
                className="shrink-0 p-1 hover:bg-slate-200 rounded-md text-slate-600"
                title="คัดลอก Callback URL"
              >
                {copiedCallback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

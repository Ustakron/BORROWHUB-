import React from 'react';
import { BorrowHubLogo } from './BorrowHubLogo';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import { ArrowRight, ShieldCheck, CheckCircle2, Clock, Smartphone } from 'lucide-react';

interface LandingHeroProps {
  onStartLineLogin: () => void;
  isLoading?: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartLineLogin,
  isLoading = false,
}) => {
  return (
    <div className="min-h-[92vh] min-h-[92dvh] flex flex-col items-center justify-between py-8 px-4 pb-safe relative overflow-hidden">
      {/* Background shapes using logo colors (#1B365D Navy and #F26522 Orange) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1B365D]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#F26522]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top School Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1B365D]">
          <span className="w-2 h-2 rounded-full bg-[#F26522]"></span>
          <span>{LINE_CHANNEL_CONFIG.schoolName}</span>
          <span className="text-slate-400 font-normal">| งานพัสดุและสารสนเทศ</span>
        </div>
      </div>

      {/* Center Hero (Step 1 in Image 1: เข้าสู่หน้าเว็บไซต์ BORROW HUB) */}
      <div className="my-auto max-w-xl w-full flex flex-col items-center text-center py-8">
        {/* Logo matching Image 2 */}
        <div className="mb-4 p-4 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 transform hover:scale-105 transition-transform duration-300">
          <BorrowHubLogo size="lg" variant="full" showSubtext={false} />
        </div>

        {/* Headline & Slogan matching Image 1 */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight mt-2">
          ระบบศูนย์กลางการยืม-ให้ยืมสิ่งของภายในโรงเรียน
        </h1>
        <p className="text-base sm:text-lg font-bold text-[#F26522] mt-2">
          "ยืมง่าย ให้สะดวก จัดการได้ในที่เดียว"
        </p>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md leading-relaxed">
          พัฒนาขึ้นสำหรับโรงเรียนสระแก้ว ปลอดภัยด้วยการยืนยันตัวตนจริงผ่าน LINE Login เพื่อเชื่อมโยงบัญชีและรับการแจ้งเตือนแบบเรียลไทม์
        </p>

        {/* LINE Login Action Button */}
        <div className="w-full max-w-sm mt-8 space-y-3">
          <button
            onClick={onStartLineLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-base rounded-2xl shadow-xl shadow-[#06C755]/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-white text-[#06C755] font-black text-xs flex items-center justify-center shadow-xs">
                  LINE
                </div>
                <span>เข้าสู่ระบบด้วย LINE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights from Image 1 */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-10 pt-6 border-t border-slate-200/80 text-center">
          <div className="p-2">
            <div className="w-7 h-7 mx-auto rounded-lg bg-[#1B365D]/10 text-[#1B365D] flex items-center justify-center mb-1">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 block">LINE Login</span>
            <span className="text-[10px] text-slate-400">เข้าใช้งานง่าย</span>
          </div>
          <div className="p-2">
            <div className="w-7 h-7 mx-auto rounded-lg bg-[#F26522]/10 text-[#F26522] flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 block">แจ้งเตือนคาบเรียน</span>
            <span className="text-[10px] text-slate-400">ก่อนถึงกำหนดคืน</span>
          </div>
          <div className="p-2">
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 block">อนุมัติเรียลไทม์</span>
            <span className="text-[10px] text-slate-400">ระบบตรวจสอบแม่นยำ</span>
          </div>
        </div>
      </div>

      {/* Footer info — เว้นเผื่อแถบล่าง iPhone (Safari toolbar / home bar) */}
      <div className="text-center text-[11px] text-slate-400 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        © 2026 BORROW HUB • {LINE_CHANNEL_CONFIG.schoolName}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
};

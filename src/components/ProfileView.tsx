import React, { useState, useEffect } from 'react';
import { User, BorrowRequest } from '../types';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import { UserCheck, ShieldCheck, Mail, Phone, School, Award, Clock, CheckCircle2, AlertTriangle, Save, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  userRequests: BorrowRequest[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  userRequests,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '081-234-5678');
  const [isSaved, setIsSaved] = useState(false);

  // LINE OA friendship: 'checking' | 'friend' | 'not-friend' | 'error'
  const [friendStatus, setFriendStatus] = useState<'checking' | 'friend' | 'not-friend' | 'error'>('checking');
  const [friendError, setFriendError] = useState<string | null>(null);

  const checkFriendship = async () => {
    if (!currentUser.lineUserId) {
      setFriendStatus('error');
      setFriendError('ไม่พบ LINE User ID ของผู้ใช้นี้');
      return;
    }
    try {
      setFriendStatus((prev) => (prev === 'not-friend' || prev === 'error' ? prev : 'checking'));
      setFriendError(null);
      const res = await fetch(`/api/line/friendship?userId=${encodeURIComponent(currentUser.lineUserId)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data.isFriend !== 'boolean') {
        // แยกสาเหตุให้ชัด — อย่าเหมารวมว่า token หายทุกครั้ง
        const serverMsg: string | undefined =
          data && typeof data.error === 'string' ? data.error : undefined;
        if (res.status === 503) {
          setFriendError(serverMsg || 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN');
        } else if (res.status === 404) {
          setFriendError(
            'ไม่พบ API /api/line/friendship (404) — frontend อาจรันแยกกับ backend (เช่น vite :5173 เพียวๆ) หรือ deploy แบบ static ไม่มี server/function',
          );
        } else if (!data) {
          setFriendError(`API ตอบกลับไม่ใช่ JSON (HTTP ${res.status}) — อาจโดน rewrite ไปหน้า index.html`);
        } else {
          setFriendError(serverMsg || `ตรวจสอบไม่สำเร็จ (HTTP ${res.status})`);
        }
        console.warn('[ProfileView] friendship check failed:', res.status, data);
        setFriendStatus('error');
        return;
      }
      setFriendError(null);
      setFriendStatus(data.isFriend ? 'friend' : 'not-friend');
    } catch (e: any) {
      console.warn('[ProfileView] friendship fetch exception:', e);
      setFriendError(e?.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      setFriendStatus('error');
    }
  };

  useEffect(() => {
    checkFriendship();
    const timer = setInterval(checkFriendship, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.lineUserId]);

  const completedReturns = userRequests.filter((r) => r.status === 'returned').length;
  const currentActive = userRequests.filter((r) => r.status === 'borrowed' || r.status === 'overdue').length;
  const overdueCount = userRequests.filter((r) => r.status === 'overdue').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      phone,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-4 border-slate-100 shadow-md"
            />
            <div className="absolute -bottom-2 -right-2 bg-[#06C755] text-white p-1.5 rounded-xl border-2 border-white shadow-xs">
              <span className="text-[10px] font-black px-1">LINE</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-[#1B365D] text-white text-xs font-bold">
                {currentUser.role === 'admin' ? 'ครูผู้ดูแลระบบ' : 'นักเรียน'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FFF3EB] text-[#F26522] text-xs font-bold border border-orange-200">
                {LINE_CHANNEL_CONFIG.schoolName}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#1B365D]">{currentUser.name}</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {currentUser.grade} {currentUser.room ? `ห้อง ${currentUser.room}` : ''} • รหัสประจำตัว {currentUser.studentId}
            </p>

            {/* LINE Connected Badge */}
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 inline-flex flex-wrap items-center gap-3 text-xs text-emerald-800">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#06C755]" />
                <span>เชื่อมต่อ LINE Login สำเร็จ</span>
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                {currentUser.lineUserId}
              </span>
            </div>

            {/* LINE OA friend status — shows whether the user added the OA, with an Add button */}
            <div
              className={`mt-3 p-3 rounded-xl border inline-flex flex-wrap items-center gap-3 text-xs ${
                friendStatus === 'friend'
                  ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-800'
                  : friendStatus === 'not-friend'
                  ? 'bg-[#06C755]/5 border-[#06C755]/40 text-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                {friendStatus === 'friend' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>เพิ่มเพื่อน {LINE_CHANNEL_CONFIG.oaName} แล้ว ✅</span>
                  </>
                ) : friendStatus === 'not-friend' ? (
                  <>
                    <MessageCircle className="w-4 h-4 text-[#06C755]" />
                    <span>ยังไม่ได้เพิ่มเพื่อน {LINE_CHANNEL_CONFIG.oaName}</span>
                  </>
                ) : friendStatus === 'checking' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>กำลังตรวจสอบสถานะเพื่อน LINE OA...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>
                      ตรวจสอบสถานะเพื่อนไม่ได้{friendError ? ` — ${friendError}` : ' (ยังไม่ตั้งค่า Token)'} — ยังรับแจ้งเตือนผ่านเว็บได้
                    </span>
                  </>
                )}
              </span>
              {friendStatus === 'not-friend' && (
                <a
                  href={LINE_CHANNEL_CONFIG.oaAddFriendUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เพิ่มเพื่อน {LINE_CHANNEL_CONFIG.oaName}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Borrowing Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">กำลังยืมอยู่</span>
            <span className="text-2xl font-bold text-[#1B365D]">{currentActive} รายการ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">ส่งคืนสำเร็จแล้ว</span>
            <span className="text-2xl font-bold text-emerald-700">{completedReturns} รายการ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">เกินกำหนดส่ง</span>
            <span className="text-2xl font-bold text-red-600">{overdueCount} รายการ</span>
          </div>
        </div>
      </div>

      {/* Profile Details Edit Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xs">
        <h3 className="text-base font-bold text-[#1B365D] mb-4">ข้อมูลส่วนตัวและการติดต่อ</h3>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมลที่ลงทะเบียน
              </label>
              <input
                type="text"
                disabled
                value={currentUser.email || LINE_CHANNEL_CONFIG.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานศึกษา
              </label>
              <input
                type="text"
                disabled
                value={LINE_CHANNEL_CONFIG.schoolName}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B365D] hover:bg-[#0F2444] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#F26522]" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { BorrowHubLogo } from './BorrowHubLogo';
import { User } from '../types';
import { RealLineProfile } from './LineLoginModal';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import {
  UserCheck,
  Sparkles,
  X,
  ShieldCheck,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  lineProfile: RealLineProfile | null;
  onRegisterSuccess: (newUser: User) => void;
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  lineProfile,
  onRegisterSuccess,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('ม.6');
  const [room, setRoom] = useState('1');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // LINE OA friendship status: 'checking' | 'friend' | 'not-friend' | 'error' | null
  const [friendStatus, setFriendStatus] = useState<'checking' | 'friend' | 'not-friend' | 'error' | null>(null);

  // Check on the server whether this LINE user has added the LINE OA as a friend.
  const checkFriendshipStatus = async () => {
    if (!lineProfile?.userId) {
      setFriendStatus(null);
      return;
    }
    try {
      setFriendStatus((prev) => prev || 'checking');
      const res = await fetch(`/api/line/friendship?userId=${encodeURIComponent(lineProfile.userId)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setFriendStatus('error'); // token not configured / LINE error -> allow registration
        return;
      }
      setFriendStatus(data.isFriend ? 'friend' : 'not-friend');
    } catch {
      setFriendStatus('error');
    }
  };

  useEffect(() => {
    if (lineProfile) {
      setFullName(lineProfile.displayName || '');
    }
  }, [lineProfile]);

  // Auto-poll friendship status every 3s while the modal is open,
  // so the registration can be completed right after the user taps "Add" in LINE.
  useEffect(() => {
    if (isOpen && lineProfile?.userId) {
      checkFriendshipStatus();
      const timer = setInterval(checkFriendshipStatus, 3000);
      return () => clearInterval(timer);
    }
    setFriendStatus(null);
  }, [isOpen, lineProfile?.userId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    // Require the user to have added the LINE OA as a friend before registering
    // (only enforced when the server can verify friendship status).
    if (friendStatus !== 'friend' && friendStatus !== 'error') return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      lineUserId: lineProfile?.userId || `U${Math.random().toString(36).substring(2, 10)}`,
      name: fullName.trim(),
      studentId: studentId.trim() || String(Math.floor(10000 + Math.random() * 90000)),
      grade: role === 'teacher' ? 'อาจารย์' : grade,
      room: role === 'teacher' ? 'บุคลากร' : room,
      role: role === 'teacher' ? 'admin' : 'student',
      avatar:
        lineProfile?.pictureUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: phone.trim() || '081-000-0000',
    };

    onRegisterSuccess(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* Header with Logo */}
        <div className="p-5 bg-gradient-to-b from-[#1B365D]/5 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BorrowHubLogo size="sm" variant="icon" />
            <div>
              <h3 className="font-bold text-[#1B365D] text-base">BORROW HUB</h3>
              <p className="text-xs text-slate-500">โรงเรียนสระแก้ว • สมัครสมาชิกครั้งแรก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 5 Form content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              {lineProfile?.pictureUrl ? (
                <img
                  src={lineProfile.pictureUrl}
                  alt={lineProfile.displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#06C755] shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FFF3EB] text-[#F26522] flex items-center justify-center font-bold">
                  <UserCheck className="w-8 h-8" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-[#06C755] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                LINE
              </span>
            </div>
            <h4 className="text-xl font-bold text-[#1B365D]">ลงทะเบียนข้อมูลผู้ใช้</h4>
            <p className="text-xs text-slate-500 mt-1">
              เชื่อมโยงกับบัญชี LINE ของคุณเรียบร้อยแล้ว กรุณาระบุข้อมูลเพื่อใช้ยืม-คืนของ
            </p>
          </div>

          <div className="space-y-4">
            {/* Role switch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สถานะผู้ใช้งาน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    role === 'student'
                      ? 'bg-[#1B365D] text-white border-[#1B365D] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  นักเรียน (Student)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    role === 'teacher'
                      ? 'bg-[#F26522] text-white border-[#F26522] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ครู / เจ้าหน้าที่ (Admin)
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]"
              />
            </div>

            {/* Grade & Room */}
            {role === 'student' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับชั้น <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ห้อง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={String(num)}>
                        ห้อง {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กลุ่มสาระ / ฝ่ายงาน
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="เช่น กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                />
              </div>
            )}

            {/* Student ID & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสประจำตัว
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 45892"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
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
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#06C755]" />
                <span>LINE User ID:</span>
              </span>
              <span className="font-mono text-slate-800 font-medium truncate max-w-[180px]">
                {lineProfile?.userId || 'U33a06f9b4e2e0bac95284f0f235591f3'}
              </span>
            </div>

            {/* LINE OA Add-friend step — required so user can receive real LINE notifications */}
            <div
              className={`rounded-2xl border p-3.5 transition-colors ${
                friendStatus === 'friend'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-[#06C755]/5 border-[#06C755]/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 text-white ${
                    friendStatus === 'friend' ? 'bg-emerald-600' : 'bg-[#06C755]'
                  }`}
                >
                  {friendStatus === 'friend' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">
                    {friendStatus === 'friend'
                      ? `แอดเพื่อน ${LINE_CHANNEL_CONFIG.oaName} เรียบร้อยแล้ว ✅`
                      : `เพิ่มเพื่อน LINE OA (${LINE_CHANNEL_CONFIG.oaName}) เพื่อรับการแจ้งเตือน`}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {friendStatus === 'friend'
                      ? 'ระบบจะส่งข้อความแจ้งเตือนสถานะ ยืม / คืน / อนุมัติ เข้า LINE ของคุณอัตโนมัติ'
                      : friendStatus === 'error'
                      ? 'ไม่สามารถตรวจสอบสถานะเพื่อนได้ (ยังไม่ได้ตั้งค่าบัญชี LINE OA) — ยังสามารถสมัครต่อได้'
                      : 'กดปุ่มด้านล่างเพื่อเปิด LINE แล้วแตะปุ่มเพิ่มเพื่อน ระบบจะตรวจสอบให้อัตโนมัติทุก 3 วินาที'}
                  </p>

                  {friendStatus === 'not-friend' && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      <a
                        href={LINE_CHANNEL_CONFIG.oaAddFriendUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        เปิด LINE แล้วเพิ่มเพื่อน {LINE_CHANNEL_CONFIG.oaName}
                      </a>
                      <button
                        type="button"
                        onClick={() => checkFriendshipStatus()}
                        className="text-[11px] font-semibold text-[#06C755] hover:underline text-left"
                      >
                        ↻ ตรวจสอบสถานะอีกครั้ง
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={friendStatus !== 'friend' && friendStatus !== 'error'}
              className="w-full py-3.5 px-4 bg-[#1B365D] hover:bg-[#0F2444] text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1B365D] disabled:active:scale-100"
            >
              <Sparkles className="w-4 h-4 text-[#F26522]" />
              <span>บันทึกและเริ่มใช้งาน BORROW HUB</span>
            </button>
            {friendStatus === 'not-friend' && (
              <p className="mt-2 text-center text-[11px] text-rose-600 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                กรุณาแอดเพื่อน LINE OA ก่อน เพื่อให้ระบบแจ้งเตือนยืม-คืนถึง LINE ของคุณได้
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

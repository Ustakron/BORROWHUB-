import React, { useState } from 'react';
import { User, BorrowRequest } from '../types';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import { UserCheck, ShieldCheck, Mail, Phone, School, Award, Clock, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

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

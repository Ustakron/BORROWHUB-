import React from 'react';
import { User, BorrowRequest, Item } from '../types';
import { Package, Clock, CheckCircle2, AlertTriangle, ArrowRight, Calendar, User as UserIcon, BellRing, Sparkles } from 'lucide-react';
import { BorrowHubLogo } from './BorrowHubLogo';

interface DashboardOverviewProps {
  currentUser: User;
  activeBorrows: BorrowRequest[];
  pendingRequests: BorrowRequest[];
  overdueRequests: BorrowRequest[];
  allItems: Item[];
  onNavigateToCatalog: () => void;
  onNavigateToRequests: () => void;
  onReturnItem: (requestId: string) => void;
  onSimulateOverdue: (requestId: string) => void;
  onQuickBorrow: (item: Item) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentUser,
  activeBorrows,
  pendingRequests,
  overdueRequests,
  allItems,
  onNavigateToCatalog,
  onNavigateToRequests,
  onReturnItem,
  onSimulateOverdue,
  onQuickBorrow,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Profile Card (Matching Step 4 & 6 in Image 1) */}
      <div className="bg-gradient-to-r from-[#1B365D] via-[#1E3A8A] to-[#0F2444] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#F26522]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 -mb-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* User greeting */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#06C755] rounded-full border-2 border-[#1B365D]">
                <span className="block w-2.5 h-2.5 rounded-full bg-white"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[#FFF3EB] border border-white/10">
                  {currentUser.role === 'admin' ? 'ครูผู้ดูแลระบบ' : 'นักเรียนโรงเรียนสระแก้ว'}
                </span>
                <span className="text-xs text-white/70">LINE Connected</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">
                ยินดีต้อนรับ {currentUser.name}
              </h1>
              <p className="text-sm text-white/80 font-medium mt-0.5">
                {currentUser.role === 'student'
                  ? `ระดับชั้น ${currentUser.grade}/${currentUser.room} • รหัส ${currentUser.studentId}`
                  : `${currentUser.grade} • ${currentUser.room}`}
              </p>
            </div>
          </div>

          {/* Stat Badges (Image 1 step 4: ของที่ยืมอยู่ 2 รายการ, คำขอรออนุมัติ 1 รายการ) */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              onClick={onNavigateToRequests}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 cursor-pointer transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-white/80 block">ของที่ยืมอยู่</span>
                <span className="text-lg font-bold text-white leading-tight">
                  {activeBorrows.length} รายการ
                </span>
              </div>
            </div>

            <div
              onClick={onNavigateToRequests}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 cursor-pointer transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-white/80 block">คำขอรออนุมัติ</span>
                <span className="text-lg font-bold text-[#FFF3EB] leading-tight">
                  {pendingRequests.length} รายการ
                </span>
              </div>
            </div>

            {overdueRequests.length > 0 && (
              <div
                onClick={onNavigateToRequests}
                className="flex items-center gap-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-red-500/30 cursor-pointer transition-all animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/30 text-red-300 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-red-200 block">เกินกำหนดส่ง</span>
                  <span className="text-lg font-bold text-white leading-tight">
                    {overdueRequests.length} รายการ!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert Banner (Step 10 in Image 1) */}
      {overdueRequests.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-xl text-red-600 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-sm">
                ⚠️ มีรายการยืมที่เกินกำหนดส่งคืน (OVERDUE) {overdueRequests.length} รายการ
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                ระบบได้ส่งการแจ้งเตือนสีแดงไปยัง LINE ของคุณ กรุณานำอุปกรณ์ไปส่งคืนที่จุดคืนทันทีเพื่อมิให้ส่งผลต่อคะแนนความประพฤติ
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToRequests}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
          >
            จัดการส่งคืน
          </button>
        </div>
      )}

      {/* Grid: Currently Borrowed Items (Step 10: การคืนของ) & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Borrowed Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="font-bold text-[#1B365D] text-base">
                อุปกรณ์ที่กำลังถือครอง / ยืมอยู่ในขณะนี้
              </h3>
            </div>
            <button
              onClick={onNavigateToRequests}
              className="text-xs font-semibold text-[#1B365D] hover:text-[#F26522] flex items-center gap-1 transition-colors"
            >
              <span>ดูประวัติการยืม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeBorrows.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">คุณยังไม่มีรายการที่ยืมอยู่ในขณะนี้</p>
              <button
                onClick={onNavigateToCatalog}
                className="mt-3 px-4 py-2 bg-[#1B365D] text-white text-xs font-bold rounded-xl hover:bg-[#0F2444] transition-colors"
              >
                ค้นหาอุปกรณ์เพื่อขอยืม
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBorrows.map((req) => {
                const isOverdue = req.status === 'overdue';
                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      isOverdue
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={req.itemImage}
                        alt={req.itemName}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FFF3EB] text-[#F26522]">
                            {req.itemCategory}
                          </span>
                          {isOverdue ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-600 text-white animate-pulse">
                              เกินกำหนด (OVERDUE)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              กำลังยืม
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{req.itemName}</h4>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                          <span>📅 กำหนดคืน: {req.returnDate} ({req.returnPeriod})</span>
                          <span>📍 จุดคืน: {req.returnLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Return / Simulate Overdue (Image 1 step 10) */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {!isOverdue && (
                        <button
                          onClick={() => onSimulateOverdue(req.id)}
                          title="จำลองกรณีส่งคืนช้ากว่ากำหนดเพื่อทดสอบระบบแจ้งเตือน OVERDUE"
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-medium rounded-lg border border-amber-200 transition-colors"
                        >
                          จำลองเกินกำหนด
                        </button>
                      )}
                      <button
                        onClick={() => onReturnItem(req.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>คืนของ (Return)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Item Shortcuts & System Summary */}
        <div className="space-y-6">
          {/* Quick Request Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#1B365D] text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F26522]" />
                <span>อุปกรณ์พร้อมยืมด่วน</span>
              </h4>
              <button
                onClick={onNavigateToCatalog}
                className="text-xs text-[#F26522] font-semibold hover:underline"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="space-y-2.5">
              {allItems.filter((i) => i.status === 'available').slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onQuickBorrow(item)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h5 className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {item.name}
                      </h5>
                      <span className="text-[10px] text-slate-500">{item.categoryLabel}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-[#1B365D] text-white text-[10px] font-bold shrink-0">
                    ยืม
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slogan Card matching Image 1 Step 12 */}
          <div className="bg-[#FFF3EB] rounded-2xl border border-amber-200/80 p-5 text-center">
            <div className="inline-block p-2 bg-white rounded-xl shadow-xs mb-2">
              <BorrowHubLogo size="sm" variant="icon" />
            </div>
            <h4 className="font-bold text-[#1B365D] text-sm">
              BORROW HUB
            </h4>
            <p className="text-xs text-[#F26522] font-bold mt-0.5">
              "ยืมง่าย ให้สะดวก จัดการได้ในที่เดียว"
            </p>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              ลดเวลา ลดความผิดพลาด และเพิ่มประสิทธิภาพในการใช้ทรัพยากรร่วมกันภายในโรงเรียนสระแก้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

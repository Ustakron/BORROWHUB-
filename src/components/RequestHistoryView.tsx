import React, { useState } from 'react';
import { BorrowRequest, RequestStatus, User } from '../types';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, UserCheck, MessageSquare, Send, Calendar, Check } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface RequestHistoryViewProps {
  requests: BorrowRequest[];
  currentUser: User;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
  onReturnRequest: (requestId: string) => void;
  onSimulateOverdue: (requestId: string) => void;
  onSimulateReminder: (requestId: string) => void;
}

export const RequestHistoryView: React.FC<RequestHistoryViewProps> = ({
  requests,
  currentUser,
  onApproveRequest,
  onRejectRequest,
  onReturnRequest,
  onSimulateOverdue,
  onSimulateReminder,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'borrowed' | 'overdue' | 'returned'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const filteredRequests = requests.filter((r) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return r.status === 'pending';
    if (selectedTab === 'borrowed') return r.status === 'borrowed';
    if (selectedTab === 'overdue') return r.status === 'overdue';
    if (selectedTab === 'returned') return r.status === 'returned';
    return true;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>รอการอนุมัติ</span>
          </span>
        );
      case 'approved':
      case 'borrowed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>กำลังยืมอยู่</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>เกินกำหนด (OVERDUE)</span>
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Check className="w-3 h-3" />
            <span>คืนสำเร็จแล้ว</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <XCircle className="w-3 h-3" />
            <span>ไม่อนุมัติ</span>
          </span>
        );
    }
  };

  const handleConfirmReject = (id: string) => {
    onRejectRequest(id, rejectionNote.trim() || 'อุปกรณ์จำเป็นต้องใช้ในกิจกรรมส่วนกลางของโรงเรียน');
    setRejectingId(null);
    setRejectionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Flow Explanation (Step 9 & 10 in Image 1) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B365D] flex items-center gap-2">
            <span>การจัดการคำขอยืมและประวัติการคืน</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1B365D]/10 text-[#1B365D] font-semibold">
              {filteredRequests.length} รายการ
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบบติดตามสถานะแบบเรียลไทม์ เชื่อมโยงการอนุมัติและแจ้งเตือนผ่าน LINE อัตโนมัติ
          </p>
        </div>

        {/* Workflow steps hint from Image 1 Step 9 */}
        <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <span className="font-semibold text-slate-700">ลำดับการอนุมัติ (Step 9):</span>
          <span className="text-slate-500">คำขอใหม่</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-[#06C755] font-bold">แจ้งเตือน LINE</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-blue-600 font-bold">ครูพิจารณา</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-emerald-600 font-bold">อนุมัติ / คืนของ</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedTab === 'all'
              ? 'bg-[#1B365D] text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          ทั้งหมด ({requests.length})
        </button>
        <button
          onClick={() => setSelectedTab('pending')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          รออนุมัติ ({requests.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setSelectedTab('borrowed')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedTab === 'borrowed'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          กำลังยืมอยู่ ({requests.filter((r) => r.status === 'borrowed').length})
        </button>
        <button
          onClick={() => setSelectedTab('overdue')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedTab === 'overdue'
              ? 'bg-red-600 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          เกินกำหนด ({requests.filter((r) => r.status === 'overdue').length})
        </button>
        <button
          onClick={() => setSelectedTab('returned')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedTab === 'returned'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          คืนแล้ว ({requests.filter((r) => r.status === 'returned').length})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          ไม่มีรายการในหมวดหมู่นี้
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Item & Borrower Info */}
                <div className="flex items-start gap-4">
                  <SafeImage
                    src={req.itemImage}
                    alt={req.itemName}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(req.status)}
                      <span className="text-[11px] font-semibold text-slate-400">
                        เลขที่คำขอ #{req.id}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1B365D] text-base">{req.itemName}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">ผู้ขอยืม:</span> {req.borrowerName} ({req.borrowerGrade}/{req.borrowerRoom})
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="font-semibold text-slate-800">เหตุผล:</span> {req.reason}
                    </p>
                  </div>
                </div>

                {/* Right metadata */}
                <div className="flex flex-col sm:items-end text-xs text-slate-500 space-y-1">
                  <div>
                    <span className="font-medium text-slate-700">ยืม:</span> {req.borrowDate} ({req.borrowPeriod})
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">กำหนดคืน:</span> {req.returnDate} ({req.returnPeriod})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ยื่นคำขอเมื่อ: {req.createdAt}
                  </div>
                </div>
              </div>

              {/* Locations & Timeline Details */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>📍 <strong className="text-slate-700">รับ:</strong> {req.pickupLocation}</span>
                  <span>🔄 <strong className="text-slate-700">คืน:</strong> {req.returnLocation}</span>
                  {req.approverName && (
                    <span className="text-emerald-700 font-medium">
                      ✓ อนุมัติโดย: {req.approverName}
                    </span>
                  )}
                  {req.rejectionReason && (
                    <span className="text-rose-700 font-medium">
                      ✕ เหตุผลที่ปฏิเสธ: {req.rejectionReason}
                    </span>
                  )}
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Step 9 Approval actions (Accessible to Admin or simulated teacher mode) */}
                  {req.status === 'pending' && (
                    <>
                      {rejectingId === req.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in">
                          <input
                            type="text"
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                            className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs w-48 focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleConfirmReject(req.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                          >
                            ยืนยัน
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-2 py-1.5 bg-slate-200 text-slate-600 text-xs rounded-lg"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
                          >
                            ปฏิเสธ (Reject)
                          </button>
                          <button
                            onClick={() => onApproveRequest(req.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติคำขอ (Approve)</span>
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Step 10: Reminder / Return / Overdue actions */}
                  {(req.status === 'borrowed' || req.status === 'overdue') && (
                    <>
                      <button
                        onClick={() => onSimulateReminder(req.id)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs rounded-xl transition-colors"
                        title="ทดสอบส่งแจ้งเตือนใกล้ถึงกำหนดคืนเข้า LINE"
                      >
                        🔔 ทดสอบแจ้งเตือนก่อนคืน
                      </button>
                      {req.status === 'borrowed' && (
                        <button
                          onClick={() => onSimulateOverdue(req.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs rounded-xl transition-colors"
                          title="ทดสอบกรณีเกินกำหนดส่งคืน (OVERDUE)"
                        >
                          ⚠️ จำลองเกินกำหนด
                        </button>
                      )}
                      <button
                        onClick={() => onReturnRequest(req.id)}
                        className="px-4 py-1.5 bg-[#1B365D] hover:bg-[#0F2444] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-[#F26522]" />
                        <span>บันทึกการส่งคืน (Return)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Item, User, BorrowRequest } from '../types';
import { Send, Calendar, Clock, MapPin, AlertCircle, X } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface BorrowModalProps {
  isOpen: boolean;
  item: Item | null;
  currentUser: User;
  onClose: () => void;
  onSubmit: (requestData: Omit<BorrowRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  item,
  currentUser,
  onClose,
  onSubmit,
}) => {
  const [borrowDate, setBorrowDate] = useState('15/05/2568');
  const [borrowPeriod, setBorrowPeriod] = useState('คาบ 3');
  const [returnDate, setReturnDate] = useState('15/05/2568');
  const [returnPeriod, setReturnPeriod] = useState('คาบ 4');
  const [reason, setReason] = useState('ใช้ทำรายงานวิชาคณิตศาสตร์');
  const [pickupLocation, setPickupLocation] = useState(item?.location || 'ห้องสมุด');
  const [returnLocation, setReturnLocation] = useState(`ห้องเรียน ${currentUser.grade}/${currentUser.room}`);
  const [note, setNote] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.categoryLabel,
      itemImage: item.image,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      borrowerGrade: currentUser.grade,
      borrowerRoom: currentUser.room,
      borrowerLineId: currentUser.lineUserId,
      borrowDate,
      borrowPeriod,
      returnDate,
      returnPeriod,
      pickupLocation,
      returnLocation,
      reason,
      note,
    });
  };

  const periodOptions = [
    'คาบ 1 (08.30 - 09.20 น.)',
    'คาบ 2 (09.20 - 10.10 น.)',
    'คาบ 3 (10.10 - 11.00 น.)',
    'คาบ 4 (11.00 - 11.50 น.)',
    'พักกลางวัน (11.50 - 12.40 น.)',
    'คาบ 5 (12.40 - 13.30 น.)',
    'คาบ 6 (13.30 - 14.20 น.)',
    'คาบ 7 (14.20 - 15.10 น.)',
    'คาบ 8 (15.10 - 16.00 น.)',
    'กิจกรรมหลังเลิกเรียน (16.00 - 17.30 น.)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg my-8 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="bg-[#1B365D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse"></span>
            <h3 className="font-bold text-lg">แบบฟอร์มส่งคำขอยืมอุปกรณ์</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Item Preview Card (Matching Step 8 in Image 1) */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-5">
            <SafeImage
              src={item.image}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-[#FFF3EB] text-[#F26522] rounded-md mb-1">
                {item.categoryLabel}
              </span>
              <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>ที่จัดเก็บ: {item.location}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            {/* Borrow Date & Period */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1B365D]" />
                <span>วันที่/คาบที่ต้องการยืม</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  placeholder="15/05/2568"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                />
                <select
                  value={borrowPeriod}
                  onChange={(e) => setBorrowPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt} value={opt.split(' ')[0] + ' ' + opt.split(' ')[1]}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เหตุผลในการยืม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="เช่น ใช้ทำรายงานวิชาคณิตศาสตร์, ใช้ในการแข่งขันกีฬาสี"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
              />
            </div>

            {/* Return Date & Period */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F26522]" />
                <span>วันที่/คาบที่ต้องการคืน</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  placeholder="15/05/2568"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                />
                <select
                  value={returnPeriod}
                  onChange={(e) => setReturnPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt} value={opt.split(' ')[0] + ' ' + opt.split(' ')[1]}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Locations (Pickup & Return) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่รับ
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="ห้องสมุด"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่คืน
                </label>
                <input
                  type="text"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  placeholder="ห้องเรียน ม.6/1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุความต้องการเพิ่มเติม เช่น อุปกรณ์เสริม หรือข้อควรระวัง..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/30"
              />
            </div>
          </div>

          <div className="mt-5 p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 text-xs text-emerald-800">
            <AlertCircle className="w-4 h-4 text-[#06C755] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ระบบแจ้งเตือนอัตโนมัติ:</span> เมื่อส่งคำขอ ระบบจะส่งข้อความแจ้งเตือนครูผู้ดูแลผ่าน LINE ทันที และจะแจ้งผลการอนุมัติกลับมายัง LINE ของคุณ
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors text-sm text-center"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 px-4 bg-[#F26522] hover:bg-[#d95314] text-white font-bold rounded-xl shadow-md shadow-[#F26522]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>ส่งคำขอ (Submit)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

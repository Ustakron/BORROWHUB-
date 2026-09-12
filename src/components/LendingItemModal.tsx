import React, { useEffect, useState } from 'react';
import { Item, ItemCategory, User } from '../types';
import { X, Plus, Edit2, Upload, Link2, Image as ImageIcon, XCircle } from 'lucide-react';
import { PRESET_ITEM_IMAGES } from '../data/mockData';
import { SafeImage } from './SafeImage';

interface LendingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  currentUser?: User | null;
  editingItem?: Item | null;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  all: 'ทั้งหมด',
  learning: 'อุปกรณ์การเรียน',
  sports: 'กีฬา',
  electronics: 'อิเล็กทรอนิกส์',
  music_activity: 'ดนตรี / กิจกรรม',
  other: 'อื่นๆ',
};

const MAX_FILE_BYTES = 2 * 1024 * 1024; // จำกัดไฟล์รูป 2MB (เก็บเป็น base64 ใน localStorage ได้)

export const LendingItemModal: React.FC<LendingItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ItemCategory>('learning');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('สภาพสมบูรณ์ พร้อมใช้งาน');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isEditing = Boolean(editingItem);

  // โหลดค่าเริ่มต้นทุกครั้งที่เปิด modal (เพิ่มใหม่ = ฟอร์มว่าง / แก้ไข = ค่าเดิม)
  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setName(editingItem.name);
      setCode(editingItem.code);
      setCategory(editingItem.category);
      setLocation(editingItem.location);
      setCondition(editingItem.condition || 'สภาพสมบูรณ์ พร้อมใช้งาน');
      setDescription(editingItem.description || '');
      setImageUrl(editingItem.image || '');
    } else {
      setName('');
      setCode('');
      setCategory('learning');
      setLocation('');
      setCondition('สภาพสมบูรณ์ พร้อมใช้งาน');
      setDescription('');
      setImageUrl('');
    }
    setError('');
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleFileSelected = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ต้องเป็นรูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('ไฟล์รูปใหญ่เกิน 2MB กรุณาเลือกรูปที่มีขนาดเล็กลง');
      return;
    }
    setError('');
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result));
      setBusy(false);
    };
    reader.onerror = () => {
      setError('อ่านไฟล์รูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อของ / อุปกรณ์');
      return;
    }
    if (!location.trim()) {
      setError('กรุณาระบุสถานที่จัดเก็บ / จุดรับคืน');
      return;
    }
    setError('');

    const item: Item = {
      ...(editingItem ?? {}),
      id: editingItem?.id ?? `item-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || `SK-${Math.floor(100 + Math.random() * 900)}`,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      image: imageUrl.trim() || PRESET_ITEM_IMAGES[0].url,
      location: location.trim(),
      status: editingItem?.status ?? 'available',
      condition: condition.trim() || 'สภาพสมบูรณ์ พร้อมใช้งาน',
      description:
        description.trim() ||
        (currentUser
          ? `ของส่วนตัวของ ${currentUser.name} เปิดให้ยืมสำหรับนักเรียนและครูภายในโรงเรียน`
          : 'อุปกรณ์พร้อมให้บริการยืมสำหรับนักเรียนและครู'),
      // เจ้าของของ: ผู้ที่เพิ่มรายการเอง (ถ้า admin แก้ไขของกลาง จะคงเจ้าของเดิมไว้)
      ownerId: editingItem?.ownerId ?? currentUser?.id,
      ownerName: editingItem?.ownerName ?? currentUser?.name,
      ownerApproved: true,
    };

    onSave(item);
    onClose();
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D] transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="bg-[#1B365D] px-6 py-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            {isEditing ? (
              <Edit2 className="w-5 h-5 text-[#F26522]" />
            ) : (
              <Plus className="w-5 h-5 text-[#F26522]" />
            )}
            <span>
              {isEditing ? 'แก้ไขข้อมูลของที่ให้ยืม' : 'เพิ่มของของฉันให้ยืมในระบบ BORROW HUB'}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Owner notice */}
        {currentUser && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FFF3EB] border border-amber-200/60 text-[11px] text-amber-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0"
              />
              <span>
                ทุกคน (นักเรียน / ครู) เพิ่มของตนเองที่จะให้ยืมได้ — ของนี้จะถูกบันทึกว่าเป็นของ{' '}
                <span className="font-bold">{currentUser.name}</span> และแสดงในแคตตาล็อกทันที
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
            {/* Left: form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อของ / อุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ลูกวอลเลย์บอล Mikasa ของฉัน"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className={inputCls}
                  >
                    <option value="learning">อุปกรณ์การเรียน</option>
                    <option value="sports">กีฬา</option>
                    <option value="electronics">อิเล็กทรอนิกส์</option>
                    <option value="music_activity">ดนตรี / กิจกรรม</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสประจำของ
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เว้นว่าง = สร้างให้อัตโนมัติ"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่จัดเก็บ / จุดรับคืน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น ห้อง ม.6/1, ห้องพักครู, โรงยิม"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สภาพของ
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="เช่น สภาพดี มีรอยถูเล็กน้อย"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดและเงื่อนไขการยืม
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ยืมได้คาบละ 1 ชิ้น ต้องคืนในวันเดียวกัน อุปกรณ์ที่มาด้วย..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                />
              </div>
            </div>

            {/* Right: image picker */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                รูปของ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>

              {/* Preview */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src={imageUrl}
                  alt="ตัวอย่างรูปของ"
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 bg-slate-100">
                      <ImageIcon className="w-7 h-7" />
                      <span className="text-[10px]">ยังไม่ได้เลือกรูป</span>
                    </div>
                  }
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    title="ลบรูปที่เลือก"
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload from device */}
              <label className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-[#1B365D]/40 bg-[#1B365D]/5 hover:bg-[#1B365D]/10 text-[#1B365D] text-[11px] font-semibold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{busy ? 'กำลังโหลดรูป...' : 'อัปโหลดรูปจากเครื่อง'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelected(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* Or paste URL */}
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="หรือวางลิงก์รูปภาพ..."
                  className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
                />
              </div>

              {/* Preset images */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500">หรือเลือกรูปตัวอย่าง:</span>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {PRESET_ITEM_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      title={img.label}
                      className={`relative rounded-lg overflow-hidden border transition-all ${
                        imageUrl === img.url
                          ? 'border-[#F26522] ring-2 ring-[#F26522]/40'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-10 object-cover" loading="lazy" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[8px] py-0.5 truncate px-0.5">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Validation error */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95314] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มของให้ยืม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
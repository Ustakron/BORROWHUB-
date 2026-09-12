import React, { useState } from 'react';
import { Item, ItemCategory } from '../types';
import { X, Plus, Image as ImageIcon } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newItem: Item) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ItemCategory>('learning');
  const [location, setLocation] = useState('ห้องสมุดกลาง');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const categoryLabels: Record<ItemCategory, string> = {
    all: 'ทั้งหมด',
    learning: 'อุปกรณ์การเรียน',
    sports: 'กีฬา',
    electronics: 'อิเล็กทรอนิกส์',
    music_activity: 'ดนตรี / กิจกรรม',
    other: 'อื่นๆ',
  };

  const presetImages = [
    { label: 'เครื่องคิดเลข', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80' },
    { label: 'ลูกฟุตบอล', url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=500&auto=format&fit=crop&q=80' },
    { label: 'กล้องถ่ายรูป', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80' },
    { label: 'ไมโครโฟน', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80' },
    { label: 'บาสเกตบอล', url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500&auto=format&fit=crop&q=80' },
    { label: 'อุปกรณ์วิทย์', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: Item = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || `SK-${Math.floor(100 + Math.random() * 900)}`,
      category,
      categoryLabel: categoryLabels[category],
      image: imageUrl.trim() || presetImages[0].url,
      location: location.trim() || 'ห้องพัสดุกลาง',
      status: 'available',
      condition: 'สภาพสมบูรณ์ พร้อมใช้งาน',
      description: description.trim() || 'อุปกรณ์พร้อมให้บริการยืมสำหรับนักเรียนและครู',
    };

    onAdd(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg my-8 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="bg-[#1B365D] px-6 py-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#F26522]" />
            <span>เพิ่มอุปกรณ์ใหม่ในระบบ BORROW HUB</span>
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่ออุปกรณ์ / สิ่งของ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น กล้องถ่ายรูป Sony Alpha, ลูกวอลเลย์บอล Mikasa"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่อุปกรณ์ <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
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
                รหัสประจำอุปกรณ์
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น SK-109"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สถานที่จัดเก็บ / จุดรับคืน
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น ห้องสมุดกลาง, ห้องพัสดุ อาคาร 3"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดและคำอธิบาย
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุเงื่อนไขการใช้งานและอุปกรณ์ที่มาด้วยกัน..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกภาพตัวอย่าง
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {presetImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`p-1 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                    imageUrl === img.url
                      ? 'border-[#F26522] bg-orange-50 ring-1 ring-[#F26522]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-8 h-8 rounded-md object-cover" />
                  <span className="text-[10px] text-slate-700 truncate">{img.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              บันทึกอุปกรณ์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

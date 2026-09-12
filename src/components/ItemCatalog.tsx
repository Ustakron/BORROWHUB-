import React, { useState, useMemo } from 'react';
import { Item, ItemCategory } from '../types';
import { Search, Filter, MapPin, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';

interface ItemCatalogProps {
  items: Item[];
  onSelectItemForBorrow: (item: Item) => void;
  onAddItem?: () => void;
  isAdmin?: boolean;
}

export const ItemCatalog: React.FC<ItemCatalogProps> = ({
  items,
  onSelectItemForBorrow,
  onAddItem,
  isAdmin = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'borrowed'>('all');

  const categories: { key: ItemCategory; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'learning', label: 'อุปกรณ์การเรียน' },
    { key: 'sports', label: 'กีฬา' },
    { key: 'electronics', label: 'อิเล็กทรอนิกส์' },
    { key: 'music_activity', label: 'ดนตรี / กิจกรรม' },
    { key: 'other', label: 'อื่นๆ' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#1B365D] flex items-center gap-2">
            <span>รายการของและอุปกรณ์</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1B365D]/10 text-[#1B365D] font-semibold">
              {filteredItems.length} รายการ
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ค้นหาและเลือกอุปกรณ์ที่ต้องการยืมสำหรับการเรียน กิจกรรม และการแข่งขัน
          </p>
        </div>

        {isAdmin && onAddItem && (
          <button
            onClick={onAddItem}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มอุปกรณ์ใหม่</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Section (Step 7 in Image 1) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาสิ่งของ... (เช่น เครื่องคิดเลข, ลูกฟุตบอล, กล้อง, รหัส)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-md"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Category Filter Pills (Image 1 step 7: ทั้งหมด, อุปกรณ์การเรียน, กีฬา, อื่นๆ) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-[#1B365D] text-white shadow-xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Status Filter */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> สถานะ:
          </span>
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              selectedStatus === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setSelectedStatus('available')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              selectedStatus === 'available'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            ว่าง (พร้อมยืม)
          </button>
          <button
            onClick={() => setSelectedStatus('borrowed')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              selectedStatus === 'borrowed'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            มีผู้ยืมอยู่
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-base">ไม่พบอุปกรณ์ที่ตรงกับการค้นหา</h4>
          <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isAvailable = item.status === 'available';
            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium">
                      {item.categoryLabel}
                    </span>
                  </div>
                  {/* Status badge matching Image 1: ว่าง vs มีผู้ยืมอยู่ */}
                  <div className="absolute top-2.5 right-2.5">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ว่าง</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F26522] text-white text-[11px] font-bold shadow-xs">
                        <Clock className="w-3 h-3" />
                        <span>มีผู้ยืมอยู่</span>
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-700 text-[10px] font-mono font-semibold">
                      #{item.code}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[#1B365D] text-sm line-clamp-2 leading-snug group-hover:text-[#F26522] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-[#1B365D] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => onSelectItemForBorrow(item)}
                        className="w-full py-2.5 px-4 bg-[#1B365D] hover:bg-[#0F2444] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <span>ยืมสิ่งนี้ (Request)</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800">
                          <div className="font-semibold">ผู้ยืม: {item.currentBorrowerName || 'สมชาย ใจดี'} ({item.currentBorrowerRoom || 'ม.6/1'})</div>
                          <div className="text-slate-600">กำหนดคืน: {item.currentDueDate || '15/05/2568'} ({item.currentBorrowPeriod || 'คาบ 4-6'})</div>
                        </div>
                        <button
                          disabled
                          className="w-full py-2 px-3 bg-slate-100 text-slate-400 text-xs font-medium rounded-xl cursor-not-allowed"
                        >
                          ไม่สามารถยืมได้ในขณะนี้
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

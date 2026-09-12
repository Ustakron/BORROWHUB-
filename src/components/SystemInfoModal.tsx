import React from 'react';
import { LINE_CHANNEL_CONFIG } from '../data/mockData';
import { BorrowHubLogo } from './BorrowHubLogo';
import { X, Layers, Cpu, ShieldCheck, MessageSquare, Database, Globe, CheckCircle2, TrendingUp, Clock, Users } from 'lucide-react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const techStack = [
    { label: 'Frontend', tech: 'React 19 + TypeScript + Tailwind CSS v4', icon: '💻', note: 'ธีมสี Navy (#1B365D) และ Orange (#F26522) ตามโลโก้' },
    { label: 'Database', tech: 'Firebase Firestore Ready & Local Sync', icon: '🗄️', note: 'จัดเก็บข้อมูลสิ่งของ สมาชิก และสถานะการยืมคืน' },
    { label: 'Authentication', tech: 'LINE Login (OAuth 2.1)', icon: '🟢', note: 'ยืนยันตัวตนนักเรียนและครูด้วย LINE Account' },
    { label: 'Notification', tech: 'LINE Official Account + Messaging API', icon: '💬', note: 'แจ้งเตือนสถานะ อนุมัติ และ OVERDUE ผ่าน LINE อัตโนมัติ' },
    { label: 'Backend', tech: 'Firebase Cloud Functions / Express Microservices', icon: '⚙️', note: 'จัดการเงื่อนไขการยืมและระบบจับเวลาคืนของ' },
    { label: 'School Context', tech: `${LINE_CHANNEL_CONFIG.schoolName} (${LINE_CHANNEL_CONFIG.schoolProvince})`, icon: '🏫', note: 'รองรับนักเรียนระดับชั้น ม.1 - ม.6 และคุณครูทุกกลุ่มสาระ' },
  ];

  const corePillars = [
    { title: 'Process Design', desc: 'ออกแบบกระบวนการยืมคืนให้สั้น กระชับ ลดขั้นตอนเอกสารกระดาษ', icon: '🔄' },
    { title: 'Resource Management', desc: 'บริหารจัดการอุปกรณ์โรงเรียนให้เกิดประโยชน์สูงสุดและตรวจสอบได้', icon: '📦' },
    { title: 'Time Management', desc: 'ควบคุมระยะเวลาการยืมคืนตามคาบเรียน พร้อมแจ้งเตือนตรงเวลา', icon: '⏱️' },
    { title: 'Information System', desc: 'ระบบสารสนเทศรวมศูนย์ เชื่อมต่อ LINE ในชีวิตประจำวัน', icon: '📱' },
    { title: 'Data Analysis', desc: 'วิเคราะห์สถิติการใช้งานเพื่อวางแผนจัดซื้ออุปกรณ์ในอนาคต', icon: '📊' },
    { title: 'Continuous Improvement', desc: 'พัฒนาอย่างต่อเนื่องเพื่อการศึกษาและกิจกรรมนักเรียนที่มีคุณภาพ', icon: '🚀' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-8 overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="bg-[#1B365D] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-xs">
              <BorrowHubLogo size="sm" variant="icon" />
            </div>
            <div>
              <h3 className="text-xl font-bold">โครงสร้างระบบและเทคโนโลยี (Step 11 & 12)</h3>
              <p className="text-xs text-slate-300">BORROW HUB • {LINE_CHANNEL_CONFIG.schoolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 12 Summary Card */}
          <div className="bg-[#FFF3EB] rounded-2xl border border-orange-200 p-5 text-center">
            <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider">
              System Philosophy
            </span>
            <h4 className="text-lg font-bold text-[#1B365D] mt-1">
              "ไม่ใช่แค่ว็บบอร์ด แต่คือการออกแบบกระบวนการทำงานใหม่"
            </h4>
            <p className="text-xs text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              "ลดเวลา ลดความผิดพลาด และเพิ่มประสิทธิภาพในการใช้ทรัพยากรร่วมกันภายในโรงเรียน"
            </p>
          </div>

          {/* Step 11: Tech Stack Table */}
          <div>
            <h4 className="font-bold text-[#1B365D] text-sm flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#F26522]" />
              <span>เทคโนโลยีที่ใช้พัฒนา (Technology Stack)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {techStack.map((tech, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1B365D] flex items-center gap-1.5">
                      <span>{tech.icon}</span>
                      <span>{tech.label}</span>
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 font-mono">
                    {tech.tech}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tech.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 12: 6 Core Pillars Grid */}
          <div>
            <h4 className="font-bold text-[#1B365D] text-sm flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#1B365D]" />
              <span>6 เสาหลักการทำงานของ BORROW HUB</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {corePillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pillar.icon}</span>
                    <h5 className="font-bold text-xs text-[#1B365D]">{pillar.title}</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* LINE Developer Credentials Box (as provided in user prompt) */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-[#06C755] font-bold">
              <span>LINE Developers Credentials</span>
              <span className="text-[10px] bg-[#06C755]/20 text-[#06C755] px-2 py-0.5 rounded-md">Verified</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>Channel ID: <span className="text-amber-400">{LINE_CHANNEL_CONFIG.channelId}</span></div>
              <div>Region: <span className="text-slate-300">{LINE_CHANNEL_CONFIG.region}</span></div>
              <div>Channel Name: <span className="text-emerald-400">{LINE_CHANNEL_CONFIG.channelName}</span></div>
              <div>School: <span className="text-slate-300">{LINE_CHANNEL_CONFIG.schoolName}</span></div>
              <div className="sm:col-span-2 truncate">Channel Secret: <span className="text-slate-400">{LINE_CHANNEL_CONFIG.channelSecret}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1B365D] hover:bg-[#0F2444] text-white text-xs font-bold rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

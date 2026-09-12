import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Optional custom fallback node rendered when the image fails to load */
  fallback?: React.ReactNode;
}

/**
 * รูปภาพแบบกันพัง: ถ้า URL โหลดไม่สำเร็จ (ลิงก์เสีย / เน็ตหลุด / CDN บล็อก)
 * จะแสดง placeholder สวย ๆ แทนการโชว์รูปแตก และ retry ใหม่เมื่อ src เปลี่ยน
 */
export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className = '', fallback }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      fallback ?? (
        <div
          className={`${className} flex items-center justify-center bg-slate-100 text-slate-300`}
          aria-label={alt}
        >
          <ImageOff className="w-1/3 h-1/3 max-w-8 max-h-8" />
        </div>
      )
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
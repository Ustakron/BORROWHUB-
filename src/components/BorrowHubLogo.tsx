import React from 'react';

interface BorrowHubLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'horizontal';
  showSubtext?: boolean;
}

export const BorrowHubLogo: React.FC<BorrowHubLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showSubtext = true,
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-sm', sub: 'text-xs' },
    md: { icon: 48, text: 'text-lg', sub: 'text-sm' },
    lg: { icon: 72, text: 'text-2xl', sub: 'text-base' },
    xl: { icon: 100, text: 'text-3xl', sub: 'text-lg' },
  };

  const { icon: iconSize } = sizeMap[size];

  // SVG Icon recreated precisely from Image 2
  const renderIcon = (svgSize: number) => (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* 3 Sun rays on top-right of the roof in orange */}
      <path
        d="M102 24L112 14"
        stroke="#F26522"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M115 35L128 28"
        stroke="#F26522"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M116 48L130 48"
        stroke="#F26522"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Roof Gable in Navy */}
      <path
        d="M36 50L80 20L124 50"
        stroke="#1B365D"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Letter 'B' Body in Deep Navy */}
      <path
        d="M50 49H96C112 49 122 57 122 71C122 80 115 88 104 90C118 92 126 102 126 117C126 133 113 143 95 143H50V49Z"
        fill="#1B365D"
      />

      {/* Top Counter Opening: White background for cutout */}
      <path
        d="M68 64H92C99 64 104 68 104 74C104 80 99 84 92 84H68V64Z"
        fill="#FFFFFF"
      />

      {/* Orange Building Silhouette inside the top loop of 'B' */}
      <path
        d="M72 84V69L84 66V84H72Z"
        fill="#F26522"
      />
      <path
        d="M84 72L94 72V84H84V72Z"
        fill="#F26522"
        opacity="0.85"
      />

      {/* Lower Loop Book Cutout & Pages in White */}
      <path
        d="M66 98H94C102 98 107 103 107 110C107 118 102 123 94 123H66V98Z"
        fill="#1B365D"
      />
      {/* Book pages curving outwards (Image 2 design) */}
      <path
        d="M54 128C66 128 72 128 98 128C108 128 114 123 114 114C114 105 108 101 98 101H64C56 101 54 107 54 114C54 121 54 128 54 128Z"
        fill="#1B365D"
      />
      {/* Curved white page layers inside bottom of B */}
      <path
        d="M60 110H98C102 110 105 112 105 115C105 118 102 120 98 120H60C57 120 56 117 56 115C56 112 58 110 60 110Z"
        fill="#FFFFFF"
      />
      <path
        d="M60 124H96C100 124 103 125 103 127C103 129 100 130 96 130H60C57 130 56 128 56 127C56 125 58 124 60 124Z"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon(iconSize)}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {renderIcon(iconSize)}
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-[#1B365D] text-lg leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
            BORROW
          </span>
          <span className="font-bold tracking-widest text-[#F26522] text-xs -mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">
            — HUB —
          </span>
          {showSubtext && (
            <span className="text-[11px] text-slate-500 font-medium font-['Prompt',sans-serif] mt-0.5">
              ระบบยืมคืนโรงเรียนสระแก้ว
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default 'full' stacked layout matching Image 2
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {renderIcon(iconSize)}
      <div className="mt-1 flex flex-col items-center">
        <span className="font-black tracking-widest text-[#1B365D] text-2xl md:text-3xl leading-none font-['Plus_Jakarta_Sans',sans-serif]">
          BORROW
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="h-0.5 w-4 bg-[#F26522] rounded-full"></span>
          <span className="font-bold tracking-[0.25em] text-[#F26522] text-sm md:text-base font-['Plus_Jakarta_Sans',sans-serif]">
            HUB
          </span>
          <span className="h-0.5 w-4 bg-[#F26522] rounded-full"></span>
        </div>
        {showSubtext && (
          <span className="text-xs text-slate-600 font-medium font-['Prompt',sans-serif] mt-1.5">
            ระบบศูนย์กลางการยืม-ให้ยืมสิ่งของภายในโรงเรียน
          </span>
        )}
      </div>
    </div>
  );
};

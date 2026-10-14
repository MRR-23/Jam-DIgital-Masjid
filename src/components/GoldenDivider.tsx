import React from 'react';

interface GoldenDividerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const GoldenDivider: React.FC<GoldenDividerProps> = ({ 
  className = '', 
  size = 'md',
  color = '#dfa938'
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className={`flex flex-col items-center justify-center shrink-0 ${isLarge ? 'h-14 lg:h-16' : isSmall ? 'h-10' : 'h-12'} ${className}`}>
      {/* Top hairline */}
      <div 
        className="w-[1.5px] flex-1" 
        style={{ background: `linear-gradient(to bottom, transparent, ${color})` }}
      />
      
      {/* Center 8-point geometric star emblem */}
      <div className="my-1 flex items-center justify-center" style={{ color }}>
        <svg width={isLarge ? "13" : "11"} height={isLarge ? "13" : "11"} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 0L14.8 7.2L22 4.5L16.8 12L22 19.5L14.8 16.8L12 24L9.2 16.8L2 19.5L7.2 12L2 4.5L9.2 7.2Z"
            fill={color}
          />
          <circle cx="12" cy="12" r="2.5" fill="#fff" />
        </svg>
      </div>

      {/* Bottom hairline */}
      <div 
        className="w-[1.5px] flex-1" 
        style={{ background: `linear-gradient(to top, transparent, ${color})` }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { KasMasjid, ThemeColorKey, KasColorStyle } from '../types';
import { Wallet, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getThemePalette } from '../utils/themePalettes';

interface KasMasjidBadgeProps {
  kas: KasMasjid;
  themeColor?: ThemeColorKey;
}

export const KasMasjidBadge: React.FC<KasMasjidBadgeProps> = ({
  kas,
  themeColor = 'gold'
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const theme = getThemePalette(themeColor);
  const colorStyle: KasColorStyle = kas.colorStyle || 'white';

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const totalInfaq = (kas.infaqJumat || 0) + (kas.infaqTransfer || 0);

  // Styling presets based on colorStyle (terutama warna putih)
  const getContainerClasses = () => {
    switch (colorStyle) {
      case 'white':
        return 'bg-white text-slate-900 border-2 border-slate-200/90 shadow-2xl shadow-slate-950/15';
      case 'dark':
        return 'bg-slate-950/95 text-white border border-slate-800 shadow-2xl shadow-black/60';
      case 'emerald':
        return 'bg-emerald-950/95 text-emerald-50 border border-emerald-500/50 shadow-2xl shadow-emerald-950/50';
      case 'gold':
        return 'bg-amber-950/95 text-amber-50 border border-amber-500/50 shadow-2xl shadow-amber-950/50';
      case 'glass':
      default:
        return 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl text-slate-900 dark:text-white border border-white/50 dark:border-slate-800 shadow-xl';
    }
  };

  const getLabelColor = () => {
    if (colorStyle === 'white') return 'text-slate-500';
    if (colorStyle === 'dark') return 'text-slate-400';
    if (colorStyle === 'emerald') return 'text-emerald-300';
    if (colorStyle === 'gold') return 'text-amber-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const getNominalColor = () => {
    if (colorStyle === 'white') return 'text-slate-950 font-black';
    if (colorStyle === 'dark') return 'text-white font-black';
    if (colorStyle === 'emerald') return 'text-white font-black';
    if (colorStyle === 'gold') return 'text-white font-black';
    return 'text-slate-900 dark:text-white font-black';
  };

  const getPopupClasses = () => {
    switch (colorStyle) {
      case 'white':
        return 'bg-white text-slate-900 border border-slate-200 shadow-2xl';
      case 'dark':
        return 'bg-slate-950 text-white border border-slate-800 shadow-2xl';
      case 'emerald':
        return 'bg-emerald-950 text-emerald-100 border border-emerald-800 shadow-2xl';
      case 'gold':
        return 'bg-amber-950 text-amber-100 border border-amber-800 shadow-2xl';
      case 'glass':
      default:
        return 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl';
    }
  };

  return (
    <div className="absolute top-[78px] lg:top-[88px] left-6 lg:left-8 z-20 select-none">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`cursor-pointer rounded-2xl p-2.5 px-4 flex items-center space-x-3.5 transition-all duration-300 hover:shadow-2xl hover:scale-102 group ${getContainerClasses()}`}
      >
        {/* Wallet Icon */}
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: colorStyle === 'white' ? theme.primary : undefined }}
        >
          <div className={colorStyle !== 'white' ? 'w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30' : ''}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] lg:text-[11px] font-bold uppercase tracking-wider ${getLabelColor()}`}>
              Saldo Kas Masjid
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${
              colorStyle === 'white'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
            }`}>
              {kas.periode || "Jum'at Ini"}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className={`font-['Orbitron',sans-serif] text-base lg:text-lg tracking-tight ${getNominalColor()}`}>
              {formatRupiah(kas.saldoAkhir)}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +{formatRupiah(totalInfaq)}
            </span>
          </div>
        </div>

        {/* Expand toggle arrow */}
        <div className={`pl-1 transition-colors ${
          colorStyle === 'white' ? 'text-slate-400 group-hover:text-slate-700' : 'text-slate-400 group-hover:text-white'
        }`}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Financial Breakdown Card */}
      {isExpanded && (
        <div className={`mt-2 w-76 rounded-2xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${getPopupClasses()}`}>
          <div className={`text-[11px] font-bold pb-1.5 border-b flex justify-between ${
            colorStyle === 'white' ? 'text-slate-800 border-slate-200' : 'text-slate-200 border-slate-800'
          }`}>
            <span>Rincian Laporan Kas Masjid</span>
            <span className="text-[10px] text-slate-400 font-normal">Klik untuk tutup</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className={`flex justify-between items-center ${colorStyle === 'white' ? 'text-slate-600' : 'text-slate-300'}`}>
              <span>Saldo Awal:</span>
              <span className="font-mono font-semibold">{formatRupiah(kas.saldoAwal)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Infaq Jum'at / Kotak:</span>
              <span className="font-mono font-bold">+{formatRupiah(kas.infaqJumat)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Infaq QRIS / Transfer:</span>
              <span className="font-mono font-bold">+{formatRupiah(kas.infaqTransfer)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-medium">
              <span>Pengeluaran:</span>
              <span className="font-mono font-bold">-{formatRupiah(kas.pengeluaran)}</span>
            </div>
            <div className={`flex justify-between items-center pt-1.5 border-t font-bold ${
              colorStyle === 'white' ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
            }`}>
              <span>Saldo Akhir:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                {formatRupiah(kas.saldoAkhir)}
              </span>
            </div>
          </div>

          {kas.keterangan && (
            <div className={`pt-1.5 border-t text-[10px] italic text-center ${
              colorStyle === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              "{kas.keterangan}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

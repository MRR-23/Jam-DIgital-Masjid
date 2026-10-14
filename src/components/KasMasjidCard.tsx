import React from 'react';
import { KasMasjid, ThemeColorKey, KasColorStyle } from '../types';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getThemePalette } from '../utils/themePalettes';

interface KasMasjidCardProps {
  kas: KasMasjid;
  themeColor?: ThemeColorKey;
  onClose?: () => void;
}

export const KasMasjidCard: React.FC<KasMasjidCardProps> = ({
  kas,
  themeColor = 'gold',
  onClose
}) => {
  if (!kas.enabled) return null;

  const theme = getThemePalette(themeColor);
  const colorStyle: KasColorStyle = kas.colorStyle || 'white';

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const totalPemasukan = (kas.infaqJumat || 0) + (kas.infaqTransfer || 0);

  const getContainerStyle = () => {
    switch (colorStyle) {
      case 'white':
        return 'bg-white text-slate-900 border-2 border-slate-200 shadow-2xl';
      case 'dark':
        return 'bg-slate-950/90 backdrop-blur-md text-white border border-slate-800 shadow-2xl';
      case 'emerald':
        return 'bg-emerald-950/90 backdrop-blur-md text-white border border-emerald-600/50 shadow-2xl';
      case 'gold':
        return 'bg-amber-950/90 backdrop-blur-md text-white border border-amber-600/50 shadow-2xl';
      case 'glass':
      default:
        return 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-md text-slate-900 dark:text-white border border-white/20 shadow-2xl';
    }
  };

  return (
    <div className={`absolute top-24 left-8 z-20 max-w-sm w-full rounded-3xl p-4 animate-fade-in select-none ${getContainerStyle()}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${colorStyle === 'white' ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex items-center space-x-2">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-950 shadow-md"
            style={{ backgroundColor: theme.primary }}
          >
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${colorStyle === 'white' ? 'text-slate-900' : 'text-slate-100'}`}>
              Laporan Kas Masjid
            </h3>
            <p className={`text-[10px] font-medium ${colorStyle === 'white' ? 'text-slate-500' : 'text-slate-400'}`}>
              {kas.periode}
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className={`text-xs px-1.5 py-0.5 rounded-lg ${colorStyle === 'white' ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Saldo Akhir Highlight */}
      <div className={`my-3 p-3 rounded-2xl text-center border ${
        colorStyle === 'white' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <span className={`text-[10px] uppercase font-semibold tracking-wider ${colorStyle === 'white' ? 'text-slate-500' : 'text-slate-400'}`}>
          Saldo Akhir Kas Masjid
        </span>
        <div 
          className="font-['Orbitron',sans-serif] text-xl font-black mt-0.5"
          style={{ color: colorStyle === 'white' ? '#059669' : theme.accent }}
        >
          {formatRupiah(kas.saldoAkhir)}
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
        <div className={`p-2 rounded-xl border ${colorStyle === 'white' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-900/60 border-slate-800/80'}`}>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5 gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Pemasukan</span>
          </div>
          <div className={`font-mono font-bold ${colorStyle === 'white' ? 'text-slate-900' : 'text-slate-200'}`}>
            {formatRupiah(totalPemasukan)}
          </div>
        </div>

        <div className={`p-2 rounded-xl border ${colorStyle === 'white' ? 'bg-rose-50/60 border-rose-100' : 'bg-slate-900/60 border-slate-800/80'}`}>
          <div className="flex items-center text-rose-600 dark:text-rose-400 font-semibold mb-0.5 gap-1">
            <ArrowDownRight className="w-3 h-3" />
            <span>Pengeluaran</span>
          </div>
          <div className={`font-mono font-bold ${colorStyle === 'white' ? 'text-slate-900' : 'text-slate-200'}`}>
            {formatRupiah(kas.pengeluaran)}
          </div>
        </div>
      </div>

      {/* Sub-note */}
      {kas.keterangan && (
        <div className={`pt-2 border-t text-[10px] italic text-center ${
          colorStyle === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
        }`}>
          "{kas.keterangan}"
        </div>
      )}
    </div>
  );
};

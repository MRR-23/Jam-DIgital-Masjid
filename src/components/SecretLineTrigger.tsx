import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';

interface SecretLineTriggerProps {
  onOpenAdmin: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SecretLineTrigger: React.FC<SecretLineTriggerProps> = ({ 
  onOpenAdmin 
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret keyboard shortcut 'a' or 'F2' to toggle admin
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        onOpenAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAdmin]);

  return (
    <>
      {/* MOBILE TRIGGER: Tombol Admin Khusus di HP / Layar Sentuh agar pengurus mudah membuka panel admin di HP */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onOpenAdmin();
        }}
        className="fixed top-2.5 right-2.5 z-40 flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#061811]/90 border border-[#D4AF37]/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)] text-[#E5C158] backdrop-blur-md active:scale-95 cursor-pointer select-none"
        title="Buka Pengaturan Admin DKM"
      >
        <Settings className="w-3.5 h-3.5 text-[#E5C158]" />
        <span className="text-xs font-bold text-[#FAF6EE]">Admin</span>
      </div>

      {/* 1. DEDICATED RIGHT-UP (POJOK KANAN ATAS) TRIGGER (Desktop):
          Warna transparan saat normal, berubah jadi warna emas berkilau saat kursor berada di atasnya */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onOpenAdmin();
        }}
        className="hidden sm:flex fixed top-0 right-0 w-28 h-20 z-50 group items-start justify-end p-2 cursor-pointer select-none bg-transparent"
        title="Admin DKM (Pojok Kanan Atas / F2)"
      >
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.7)] text-amber-400 backdrop-blur-md translate-y-1 group-hover:translate-y-0">
          <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-amber-300 text-xs font-bold tracking-wide">⚙ Admin</span>
        </div>
      </div>

      {/* 2. RIGHT EDGE SECRET TRIGGER:
          Transparan saat normal, berubah jadi garis emas saat kursor mendekat */}
      <div
        className="fixed top-1/2 right-0 -translate-y-1/2 z-40 group flex items-center pr-0 select-none"
      >
        {/* Pop-up quick control panel revealed on hover/touch */}
        <div className="mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdmin();
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xl border border-amber-500/50 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="Pengaturan Admin DKM (Pintasan: F2 atau Alt+A)"
          >
            <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>Pengaturan Admin DKM</span>
          </button>
        </div>

        {/* The vertical line trigger on right screen edge:
            Warna transparan, saat kursor di atasnya menyala warna emas */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdmin();
          }}
          className="w-2 hover:w-3.5 h-36 bg-transparent hover:bg-amber-400 group-hover:bg-amber-400 rounded-l-full hover:shadow-[0_0_20px_rgba(251,191,36,0.85)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.85)] transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Klik untuk Masuk Pengaturan Admin DKM (Pintasan: F2 / Alt+A)"
        />
      </div>
    </>
  );
};



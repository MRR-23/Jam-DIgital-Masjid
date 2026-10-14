import React, { useEffect, useState } from 'react';

interface SholatDimOverlayProps {
  durationMinutes?: number;
  prayerName: string;
  onComplete: () => void;
}

export const SholatDimOverlay: React.FC<SholatDimOverlayProps> = ({
  durationMinutes = 10,
  prayerName,
  onComplete
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div 
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none p-6 text-center cursor-pointer"
      title="Klik untuk kembali ke tampilan utama"
    >
      <div className="flex flex-col items-center space-y-4 max-w-lg opacity-40 hover:opacity-90 transition-opacity">
        <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 text-2xl">
          ☪
        </div>
        <h2 className="text-2xl font-bold tracking-wider text-slate-300 uppercase">
          Sholat Berjamaah Sedang Berlangsung
        </h2>
        <p className="text-sm text-slate-500">
          Sholat {prayerName} • Layar diredupkan demi kekhusyukan ibadah
        </p>
      </div>
    </div>
  );
};

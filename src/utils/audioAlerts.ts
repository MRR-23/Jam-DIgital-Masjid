// Web Audio API Sound Synthesizer for Mosque TV
// Guarantees zero latency and works 100% offline without missing external audio files
import { AlarmToneKey } from '../types';

class AudioAlertSystem {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Nada 1: Ding-Dong Harmonis (Default Baru - Elegan, Merdu, dan Sangat Nyaman Didengar)
  private playHarmonicChime(volume: number = 0.9, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (!isFinal) {
      // Detik 5, 4, 3, 2: Nada Ding Harmonis (G5 + D6 + overtone)
      const freqs = [783.99, 1174.66, 1567.98]; // G5, D6, G6
      const weights = [0.35, 0.20, 0.10];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(weights[idx] * volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      });
    } else {
      // Detik 1 (Puncak Masuk Waktu Adzan): Grand Double Chime "Ding - Dong"
      // Ding (C6 1046.5 Hz)
      const dingFreqs = [1046.50, 1318.51, 1567.98]; // C6 major triad
      dingFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 * volume * (1 - idx * 0.2), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });

      // Dong (G5 783.99 Hz) sesaat setelah Ding (+0.28s)
      const dongFreqs = [783.99, 987.77, 1174.66];
      dongFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.28);

        gain.gain.setValueAtTime(0, now + 0.28);
        gain.gain.linearRampToValueAtTime(0.35 * volume * (1 - idx * 0.2), now + 0.30);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.28);
        osc.stop(now + 1.85);
      });
    }
  }

  // Nada 2: Lonceng Jam Sholat Digital Masjid (Tubular Bell Timbre)
  private playMasjidBell(volume: number = 0.9, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = isFinal ? 987.77 : 880.0; // B5 for final, A5 for countdown
    const harmonics = [1, 2.76, 5.4, 8.9];
    const decay = isFinal ? 1.5 : 0.7;

    harmonics.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const amp = (0.35 / (idx + 1)) * volume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }

  // Nada 3: Beep Digital Lembut Modern (Non-Abrasive Filtered Dual Beep)
  private playDigitalBeep(volume: number = 0.85, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulseCount = isFinal ? 3 : 2;

    for (let p = 0; p < pulseCount; p++) {
      const pStart = now + p * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isFinal ? 1046.5 : 880, pStart);

      gain.gain.setValueAtTime(0, pStart);
      gain.gain.linearRampToValueAtTime(0.32 * volume, pStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, pStart + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(pStart);
      osc.stop(pStart + 0.12);
    }
  }

  // Nada 4: Gong / Bedug Akustik Hangat (Warm Resonant Acoustic Gong)
  private playAcousticGong(volume: number = 0.95, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = isFinal ? 174.61 : 220.0; // F3 for final, A3 for countdown
    const decay = isFinal ? 1.8 : 0.9;

    [1, 1.98, 3.02].forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const amp = (0.4 / (idx + 1)) * volume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  // Soft Islamic chime (pleasant chime before adzan / reminder)
  public playIslamicChime(volume: number = 0.8) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.22);
        gain.gain.linearRampToValueAtTime(0.25 * volume, ctx.currentTime + idx * 0.22 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.22);
        osc.stop(ctx.currentTime + idx * 0.22 + 1.7);
      });
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  // Iqamah Warning Beep (e.g., 3 short beeps when 10s left, 1 long buzzer when Iqamah arrives)
  public playIqamahWarningBeep(isFinal: boolean = false, volume: number = 0.9) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 700, ctx.currentTime);

      const duration = isFinal ? 1.2 : 0.25;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3 * volume, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.1);
    } catch (e) {
      console.warn('Iqamah beep failed:', e);
    }
  }

  // Triple beep when countdown hits 0 (Iqamah dimulai, sholat ditegakkan)
  public playIqamahArrivalAlert(volume: number = 1.0) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      [0, 0.35, 0.7, 1.2].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const isLong = idx === 3;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isLong ? 987.77 : 880, ctx.currentTime + delay); // B5 or A5

        const dur = isLong ? 1.5 : 0.2;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.35 * volume, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.1);
      });
    } catch (e) {
      console.warn('Iqamah arrival alert failed:', e);
    }
  }

  // Main alarm pulse method for 5-second countdown & adzan alert
  // Dispatches to the chosen tone style (default: 'harmonic_chime')
  public playAlarmBeepOnce(
    volume: number = 1.0, 
    isFinal: boolean = false, 
    toneType: AlarmToneKey = 'harmonic_chime'
  ) {
    try {
      switch (toneType) {
        case 'masjid_bell':
          this.playMasjidBell(volume, isFinal);
          break;
        case 'digital_beep':
          this.playDigitalBeep(volume, isFinal);
          break;
        case 'acoustic_gong':
          this.playAcousticGong(volume, isFinal);
          break;
        case 'harmonic_chime':
        default:
          this.playHarmonicChime(volume, isFinal);
          break;
      }
    } catch (e) {
      console.warn('Alarm tone failed:', e);
    }
  }

  // Alarm preview 5 detik penuh (detik 5, 4, 3, 2, dan detik 1 puncak)
  public playAdzanAlarm5Seconds(volume: number = 1.0, toneType: AlarmToneKey = 'harmonic_chime') {
    try {
      for (let i = 0; i < 5; i++) {
        const isFinal = i === 4;
        setTimeout(() => {
          this.playAlarmBeepOnce(volume, isFinal, toneType);
        }, i * 1000);
      }
    } catch (e) {
      console.warn('Adzan 5s alarm failed:', e);
    }
  }
}

export const soundManager = new AudioAlertSystem();

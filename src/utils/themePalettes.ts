import { ThemeColorKey } from '../types';

export interface ThemePalette {
  key: ThemeColorKey;
  name: string;
  subtitle: string;
  primary: string; // for active card e.g. #e69f0b
  accent: string; // for divider lines, stars, info badge e.g. #dfa938
  glow: string;
  previewBg: string;
}

export const THEME_PALETTES: Record<ThemeColorKey, ThemePalette> = {
  gold: {
    key: 'gold',
    name: 'Emas Al-Mujahidin',
    subtitle: 'Kuning Amber Klasik (Sesuai Rujukan)',
    primary: '#e69f0b',
    accent: '#dfa938',
    glow: 'rgba(230, 159, 11, 0.4)',
    previewBg: 'bg-[#e69f0b]'
  },
  emerald: {
    key: 'emerald',
    name: 'Hijau Kubah Nabawi',
    subtitle: 'Hijau Zamrud Sejuk & Islami',
    primary: '#059669',
    accent: '#10b981',
    glow: 'rgba(5, 150, 105, 0.4)',
    previewBg: 'bg-[#059669]'
  },
  cyan: {
    key: 'cyan',
    name: 'Biru Langit & Kubah',
    subtitle: 'Biru Ottoman Modern',
    primary: '#0284c7',
    accent: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.4)',
    previewBg: 'bg-[#0284c7]'
  },
  ruby: {
    key: 'ruby',
    name: 'Merah Marun Sajadah',
    subtitle: 'Merah Beludru Mewah & Khusyuk',
    primary: '#991b1b',
    accent: '#e11d48',
    glow: 'rgba(153, 27, 27, 0.4)',
    previewBg: 'bg-[#991b1b]'
  },
  teal: {
    key: 'teal',
    name: 'Pirus Kaligrafi (Teal)',
    subtitle: 'Hijau Toska Elegan',
    primary: '#0d9488',
    accent: '#2dd4bf',
    glow: 'rgba(13, 148, 136, 0.4)',
    previewBg: 'bg-[#0d9488]'
  },
  violet: {
    key: 'violet',
    name: 'Ungu Keagungan (Violet)',
    subtitle: 'Ungu Kerajaan Artistik',
    primary: '#7c3aed',
    accent: '#a855f7',
    glow: 'rgba(124, 58, 237, 0.4)',
    previewBg: 'bg-[#7c3aed]'
  }
};

export function getThemePalette(key?: ThemeColorKey): ThemePalette {
  return THEME_PALETTES[key || 'gold'] || THEME_PALETTES.gold;
}

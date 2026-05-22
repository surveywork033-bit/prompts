export type ThemeName =
  | "midnight"
  | "cyber"
  | "ocean"
  | "neon"
  | "pink"
  | "arctic"
  | "amoled"
  | "sunset";

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  emoji: string;
  bg: string;
  cardBg: string;
  cardHover: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentBorder: string;
  indicator: string;
  glow: string;
  textPrimary: string;
  textSecondary: string;
  navBg: string;
  border: string;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  midnight: {
    id: "midnight",
    name: "Midnight Black",
    emoji: "🖤",
    bg: "bg-[#050508]",
    cardBg: "bg-slate-900/40 border-white/5 backdrop-blur-md",
    cardHover: "hover:border-indigo-500/30 sleek-card-glow",
    accent: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 text-white",
    accentHover: "indigo",
    accentText: "text-indigo-400",
    accentBorder: "border-indigo-500/30",
    indicator: "bg-indigo-600 shadow-indigo-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.12), transparent 55%)",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-450",
    navBg: "bg-[#050508]/80",
    border: "border-white/5",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Purple",
    emoji: "🔮",
    bg: "bg-[#0b0312]",
    cardBg: "bg-purple-950/20 border-fuchsia-500/10 backdrop-blur-md",
    cardHover: "hover:border-fuchsia-500/40 sleek-card-glow-cyber",
    accent: "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-500/20 text-white",
    accentHover: "fuchsia",
    accentText: "text-fuchsia-400",
    accentBorder: "border-fuchsia-500/30",
    indicator: "bg-fuchsia-600 shadow-fuchsia-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(217, 70, 239, 0.15), transparent 55%)",
    textPrimary: "text-fuchsia-50",
    textSecondary: "text-fuchsia-350/60",
    navBg: "bg-[#0b0312]/80",
    border: "border-fuchsia-500/10",
  },
  ocean: {
    id: "ocean",
    name: "Ocean Blue",
    emoji: "🌊",
    bg: "bg-[#010816]",
    cardBg: "bg-sky-950/20 border-cyan-500/10 backdrop-blur-md",
    cardHover: "hover:border-cyan-500/40 sleek-card-glow-ocean",
    accent: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20 text-white",
    accentHover: "cyan",
    accentText: "text-cyan-400",
    accentBorder: "border-cyan-500/30",
    indicator: "bg-cyan-600 shadow-cyan-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15), transparent 55%)",
    textPrimary: "text-cyan-50",
    textSecondary: "text-cyan-350/60",
    navBg: "bg-[#010816]/80",
    border: "border-cyan-500/10",
  },
  neon: {
    id: "neon",
    name: "Neon Green",
    emoji: "🟢",
    bg: "bg-[#020904]",
    cardBg: "bg-emerald-950/20 border-lime-500/10 backdrop-blur-md",
    cardHover: "hover:border-lime-500/40 sleek-card-glow-neon",
    accent: "bg-lime-600 hover:bg-lime-500 shadow-lime-500/20 text-[#020904] font-black",
    accentHover: "lime",
    accentText: "text-lime-400",
    accentBorder: "border-lime-500/30",
    indicator: "bg-lime-600 shadow-lime-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(132, 204, 22, 0.15), transparent 55%)",
    textPrimary: "text-lime-50",
    textSecondary: "text-emerald-350/60",
    navBg: "bg-[#020904]/80",
    border: "border-lime-500/10",
  },
  pink: {
    id: "pink",
    name: "Rose Pink",
    emoji: "🌸",
    bg: "bg-[#0b0206]",
    cardBg: "bg-rose-950/20 border-pink-500/10 backdrop-blur-md",
    cardHover: "hover:border-pink-500/40 sleek-card-glow-pink",
    accent: "bg-pink-600 hover:bg-pink-500 shadow-pink-500/20 text-white",
    accentHover: "pink",
    accentText: "text-pink-400",
    accentBorder: "border-pink-500/30",
    indicator: "bg-pink-600 shadow-pink-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(236, 72, 153, 0.15), transparent 55%)",
    textPrimary: "text-pink-100",
    textSecondary: "text-rose-350/60",
    navBg: "bg-[#0b0206]/80",
    border: "border-pink-500/10",
  },
  arctic: {
    id: "arctic",
    name: "Arctic White",
    emoji: "❄️",
    bg: "bg-[#f1f5f9]",
    cardBg: "bg-white/80 border-slate-200/80 shadow-sm backdrop-blur-md",
    cardHover: "hover:border-slate-400 hover:shadow-md",
    accent: "bg-slate-900 hover:bg-slate-800 shadow-slate-200 shadow text-white",
    accentHover: "slate",
    accentText: "text-slate-800 font-bold",
    accentBorder: "border-slate-350",
    indicator: "bg-slate-900 shadow-slate-400/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(100, 116, 139, 0.08), transparent 55%)",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-550",
    navBg: "bg-white/80",
    border: "border-slate-200/80",
  },
  amoled: {
    id: "amoled",
    name: "AMOLED Black",
    emoji: "🕶️",
    bg: "bg-black",
    cardBg: "bg-[#0b0b0e] border-zinc-800/80",
    cardHover: "hover:border-white/50",
    accent: "bg-white hover:bg-zinc-200 text-black font-semibold shadow-sm",
    accentHover: "slate",
    accentText: "text-white",
    accentBorder: "border-zinc-800",
    indicator: "bg-white shadow-white/10",
    glow: "none",
    textPrimary: "text-zinc-150",
    textSecondary: "text-zinc-550",
    navBg: "bg-black/85",
    border: "border-zinc-800/80",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Orange",
    emoji: "🌇",
    bg: "bg-[#0d0402]",
    cardBg: "bg-orange-950/20 border-orange-500/10 backdrop-blur-md",
    cardHover: "hover:border-orange-500/45 sleek-card-glow-sunset",
    accent: "bg-orange-600 hover:bg-orange-500 shadow-orange-500/20 text-white",
    accentHover: "orange",
    accentText: "text-orange-400",
    accentBorder: "border-orange-500/30",
    indicator: "bg-orange-600 shadow-orange-500/40",
    glow: "radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.15), transparent 55%)",
    textPrimary: "text-orange-50",
    textSecondary: "text-orange-355/60",
    navBg: "bg-[#0d0402]/80",
    border: "border-orange-500/10",
  },
};

import { Home, Search, Plus, User } from "lucide-react";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { ThemeConfig } from "../theme";

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile | null;
  theme: ThemeConfig;
}

export default function BottomNav({ activeView, onNavigate, currentUser, theme }: BottomNavProps) {
  const isDark = theme.id !== "arctic";

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "create", label: "Create", icon: Plus },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pointer-events-auto">
      {/* Dynamic Island Floating Glass Pill */}
      <motion.div 
        layout
        className={`flex h-16 w-full items-center justify-around rounded-[26px] border ${theme.border} ${theme.navBg} px-2 py-1 shadow-2xl backdrop-blur-2xl transition-colors duration-500`}
        style={{
          boxShadow: isDark 
            ? "0 24px 50px -12px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.05) inset" 
            : "0 16px 36px -10px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(255, 255, 255, 0.7) inset",
        }}
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = 
            activeView === item.id || 
            (item.id === "profile" && (activeView === "profile" || activeView === "login"));

          return (
            <button
              key={item.id}
              onClick={() => {
                // Instantly play visual feedback click trigger
                if (item.id === "profile" && !currentUser) {
                  onNavigate("login");
                } else {
                  onNavigate(item.id);
                }
              }}
              className="relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl cursor-pointer select-none group"
            >
              {/* Dynamic Liquid Morph Backdrop */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={`absolute inset-0.5 rounded-[18px] ${
                    isDark 
                      ? "bg-white/5 border border-white/5 shadow-inner" 
                      : "bg-slate-900/5 border border-slate-900/5 shadow-sm"
                  } z-0`}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 28,
                  }}
                />
              )}

              {/* Icon Container with Spring Scaling */}
              <motion.div 
                className="relative z-10 flex flex-col items-center justify-center"
                animate={{
                  scale: isActive ? 1.08 : 0.96,
                }}
                whileTap={{ scale: 0.84 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
              >
                
                {/* Active Glowing Dot Indicator underneath */}
                {isActive && (
                  <motion.span
                    layoutId="activeDotIndicator"
                    className={`absolute -top-1.5 h-1 w-1 rounded-full ${theme.indicator}`}
                    style={{
                      boxShadow: isDark ? "0 0 8px currentColor" : "none"
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 24,
                    }}
                  />
                )}

                <IconComponent
                  className={`h-4.5 w-4.5 transition-transform duration-300 ${
                    isActive ? theme.accentText : (isDark ? "text-zinc-500 group-hover:text-zinc-200" : "text-slate-400 group-hover:text-slate-705")
                  }`}
                />

                <span
                  className={`text-[9px] font-black tracking-widest uppercase mt-1 select-none transition-all duration-300 ${
                    isActive ? theme.accentText : (isDark ? "text-zinc-600 group-hover:text-zinc-450" : "text-slate-400 group-hover:text-slate-600")
                  }`}
                >
                  {item.label}
                </span>

              </motion.div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}

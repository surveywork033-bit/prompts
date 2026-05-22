import { useState } from "react";
import { Cpu, Sparkles, LogOut, Moon, Sun, ArrowLeft } from "lucide-react";
import { UserProfile } from "../types";
import { THEMES, ThemeConfig, ThemeName } from "../theme";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: ThemeName) => void;
}

export default function Navbar({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  currentTheme,
  onSelectTheme,
}: NavbarProps) {
  const [showThemes, setShowThemes] = useState(false);
  const isDark = currentTheme.id !== "arctic";

  return (
    <nav
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-300 ${currentTheme.border} ${currentTheme.navBg}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Component: Brand Logo */}
        <div
          onClick={() => onNavigate("home")}
          className="flex cursor-pointer items-center space-x-2.5 group select-none"
        >
          <div
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${currentTheme.indicator}`}
          >
            <Cpu className="h-5 w-5 text-current" />
          </div>
          <div className="flex flex-col">
            <span className={`text-base font-black tracking-tighter transition-colors duration-300 ${currentTheme.textPrimary}`}>
              PROMPTVERSE
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#6366f1] uppercase">
              GEN-Z PORTAL
            </span>
          </div>
        </div>

        {/* Center/Right: Interactive Theme Switcher Hub & creator controls */}
        <div className="flex items-center space-x-4">
          
          {/* Quick-toggle Theme Center */}
          <div className="relative">
            <button
              onClick={() => setShowThemes(!showThemes)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} hover:opacity-90 active:scale-95`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>{currentTheme.emoji} Theme</span>
            </button>

            {/* Dropdown Menu of themes */}
            <AnimatePresence>
              {showThemes && (
                <>
                  {/* Backdrop Closer */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemes(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`absolute right-0 mt-2.5 w-56 z-50 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl ${currentTheme.border} ${currentTheme.cardBg}`}
                    style={{
                      backgroundColor: isDark ? "rgba(10, 10, 15, 0.9)" : "rgba(255, 255, 255, 0.95)"
                    }}
                  >
                    <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                      <p className={`text-[10px] uppercase tracking-widest font-black ${isDark ? "text-slate-400" : "text-slate-550"}`}>
                        Select Portal Theme
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-0.5">
                      {Object.values(THEMES).map((th) => {
                        const isSelected = th.id === currentTheme.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => {
                              onSelectTheme(th.id);
                              setShowThemes(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                              isSelected 
                                ? "bg-white/10 text-white border border-white/5" 
                                : `text-slate-300 hover:bg-white/5`
                            }`}
                            style={{
                              color: isSelected ? undefined : (isDark ? "#cbd5e1" : "#1e293b")
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{th.emoji}</span>
                              <span className={isSelected ? "font-bold" : ""}>{th.name}</span>
                            </div>
                            
                            {/* Theme color previews */}
                            <div className="flex items-center space-x-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{
                                  background: th.id === "arctic" ? "#ffffff" : th.id === "amoled" ? "#1e293b" : "linear-gradient(135deg, #4f46e5, #ec4899)"
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User profile actions */}
          {currentUser ? (
            <div className="flex items-center space-x-3.5 pl-3 border-l border-white/5">
              <div 
                onClick={() => onNavigate("profile")}
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.username} 
                  referrerPolicy="no-referrer"
                  className={`h-8 w-8 rounded-full object-cover border transition-all duration-300 group-hover:scale-110 ${currentTheme.border}`}
                />
                <span className={`hidden sm:inline text-xs font-bold tracking-tight ${currentTheme.textPrimary} group-hover:opacity-85`}>
                  @{currentUser.username}
                </span>
                {currentUser.badge?.includes("Verified") && (
                  <span className="text-[10px] animate-pulse">👑</span>
                )}
              </div>

              <button 
                onClick={onLogout}
                title="Disconnect Account"
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-all duration-300 active:scale-90"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className={`flex items-center space-x-1 px-4 py-1.5 rounded-full text-xs font-black tracking-tight transition-all duration-300 cursor-pointer ${currentTheme.accent}`}
            >
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}

import { useState, useEffect, MouseEvent, FormEvent } from "react";
import { User, Shield, Edit2, Bookmark, Grid3X3, Trash2, Palette, ChevronDown } from "lucide-react";
import PromptCard from "../components/PromptCard";
import { Prompt, UserProfile as UserProfileType } from "../types";
import { THEMES, ThemeConfig, ThemeName } from "../theme";
import { motion, AnimatePresence } from "motion/react";

interface UserProfileProps {
  currentUser: UserProfileType | null;
  onUpdateProfile: (updatedData: any) => Promise<UserProfileType>;
  prompts: Prompt[];
  onSelectPrompt: (promptId: string) => void;
  onLikePrompt: (promptId: string, e: MouseEvent) => void;
  onSavePrompt: (promptId: string, e: MouseEvent) => void;
  likedPromptIds: string[];
  savedPromptIds: string[];
  onNavigate: (view: string) => void;
  onDeletePrompt: (promptId: string) => Promise<void>;
  theme: ThemeConfig;
  onSelectTheme: (themeId: ThemeName) => void;
  currentThemeName: ThemeName;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces"
];

export default function UserProfile({
  currentUser,
  onUpdateProfile,
  prompts,
  onSelectPrompt,
  onLikePrompt,
  onSavePrompt,
  likedPromptIds,
  savedPromptIds,
  onNavigate,
  onDeletePrompt,
  theme,
  onSelectTheme,
  currentThemeName
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const isDark = theme.id !== "arctic";

  useEffect(() => {
    if (currentUser) {
      setEditUsername(currentUser.username);
      setEditBio(currentUser.bio || "");
      setEditAvatar(currentUser.avatar || "");
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center text-zinc-100 flex flex-col items-center justify-center space-y-6">
        <div className={`h-16 w-16 rounded-full ${theme.cardBg} border ${theme.border} flex items-center justify-center p-3 text-purple-400 shadow-2xl`}>
          <User className="h-7 w-7" />
        </div>
        <h2 className={`text-xl font-black uppercase tracking-tight ${theme.textPrimary}`}>Identity Terminal Closed</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          Please authorize your user credentials to store custom styles, bookmarks, and edit profiles.
        </p>
        <button
          onClick={() => onNavigate("login")}
          className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-xl ${theme.accent}`}
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const myCreatedPrompts = prompts.filter((p) => p.creatorId === currentUser.id);
  const mySavedPrompts = prompts.filter((p) => savedPromptIds.includes(p.id));

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) return;

    setIsSaving(true);
    setLocalErr(null);

    try {
      await onUpdateProfile({
        id: currentUser.id,
        username: editUsername.trim(),
        bio: editBio.trim(),
        avatar: editAvatar.trim()
      });
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent("promptverse-toast", {
        detail: { message: "✨ Creator identity synced successfully!" }
      }));
    } catch (err) {
      console.error(err);
      setLocalErr("Credentials format rejected. Change inputs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (window.confirm("Do you want to permanently delete this vector rendering?")) {
      try {
        await onDeletePrompt(promptId);
        window.dispatchEvent(new CustomEvent("promptverse-toast", {
          detail: { message: "🗑️ Vector removed from ledger." }
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeThemeObj = THEMES[currentThemeName] || THEMES.midnight;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-32 text-zinc-101 min-h-screen relative">
      
      {localErr && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-100">
          ⚠️ {localErr}
        </div>
      )}

      {/* TOP-RIGHT CORNER SINGLE THEME SWITCHER ICON */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur border border-white/10 text-white shadow-xl cursor-pointer select-none transition"
        >
          <span className="text-lg">{activeThemeObj.emoji}</span>
        </button>

        <AnimatePresence>
          {showThemeSelector && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThemeSelector(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={`absolute right-0 mt-2 w-56 z-50 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl ${theme.border} ${theme.cardBg}`}
                style={{
                  backgroundColor: isDark ? "rgba(10, 10, 15, 0.95)" : "#ffffff"
                }}
              >
                <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-550 flex items-center">
                    <Palette className="h-3 w-3 mr-1" /> Choose Space Skin
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {Object.values(THEMES).map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => {
                        onSelectTheme(thm.id);
                        setShowThemeSelector(false);
                      }}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                        currentThemeName === thm.id
                          ? "bg-purple-600/15 text-purple-400 font-extrabold"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                      style={{
                        color: currentThemeName === thm.id ? undefined : (isDark ? "#d4d4d8" : "#1e293b")
                      }}
                    >
                      <span className="mr-2 text-sm">{thm.emoji}</span>
                      <span>{thm.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Center-Aligned Corporate UI Section */}
      <section className="flex flex-col items-center text-center justify-center py-6 pb-8 space-y-5 relative">
        <div className="relative">
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            referrerPolicy="no-referrer"
            className={`h-28 w-28 rounded-full object-cover border-4 ${theme.border} shadow-2xl`}
          />
          <span className="absolute bottom-1 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 border border-white/10 text-purple-400 shadow-lg">
            <Shield className="h-3.5 w-3.5 fill-current" />
          </span>
        </div>

        <div className="space-y-1 w-full max-w-md">
          <div className="flex items-center justify-center space-x-1.5">
            <h2 className={`text-xl font-black tracking-tight ${theme.textPrimary}`}>@{currentUser.username}</h2>
            {currentUser.role === "admin" && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[8px] font-black tracking-widest uppercase border border-indigo-505/20">ADMIN</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line max-w-sm mx-auto">
            {currentUser.bio || "No profile bio available yet."}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 pt-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center justify-center space-x-1.5 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-205 hover:text-white transition cursor-pointer select-none"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>{isEditing ? "Close Panel" : "Edit Profile"}</span>
          </button>
        </div>
      </section>

      {/* Expandable Editable Form Block */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 mb-8 overflow-hidden rounded-[24px] border ${theme.border} bg-black/10 p-6 backdrop-blur-xl shadow-inner`}
          >
            <form onSubmit={handleEditSubmit} className="max-w-xl mx-auto space-y-5 text-left">
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme.textPrimary}`}>Profile Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className={`rounded-xl border ${theme.border} bg-neutral-950/40 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-500 transition`}
                    style={{
                      backgroundColor: isDark ? "rgba(10, 10, 16, 0.45)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a"
                    }}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Avatar Image URL</label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className={`rounded-xl border ${theme.border} bg-neutral-950/40 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-500 transition`}
                    style={{
                      backgroundColor: isDark ? "rgba(10, 10, 16, 0.45)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a"
                    }}
                  />
                </div>
              </div>

              {/* Preset Avatars Selection Panel */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Preset Avatar</span>
                <div className="flex items-center space-x-3 pt-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(av)}
                      className={`h-10 w-10 rounded-full overflow-hidden border cursor-pointer transition ${
                        editAvatar === av ? "border-purple-500 ring-2 ring-purple-500/20 scale-105" : "border-white/5 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={av} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Biography / Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className={`rounded-xl border ${theme.border} bg-neutral-950/40 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-500 transition resize-none`}
                  style={{
                    backgroundColor: isDark ? "rgba(10, 10, 16, 0.45)" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg ${theme.accent}`}
              >
                <span>{isSaving ? "Syncing..." : "Publish Profile Changes"}</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs list ("Posts", "Saved") */}
      <div className="flex items-center justify-center space-x-4 border-b border-white/5 pb-4 mb-8">
        {[
          { id: "posts", label: "Posts", count: myCreatedPrompts.length, icon: Grid3X3 },
          { id: "saved", label: "Saved", count: mySavedPrompts.length, icon: Bookmark }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-full flex items-center space-x-2 transition select-none cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="activeUserTab"
                  className={`absolute inset-0 rounded-full ${theme.accent} opacity-10`}
                  transition={{ type: "spring", stiffness: 380, damping: 25 }}
                />
              )}
              <IconComponent className={`h-4.5 w-4.5 relative z-10 ${isActive ? theme.accentText : "text-zinc-500"}`} />
              <span className={`relative z-10 transition-colors ${isActive ? theme.accentText : "text-zinc-550 hover:text-slate-300"}`}>
                {tab.label} ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "posts" && (
            <div>
              {myCreatedPrompts.length === 0 ? (
                <div className="text-center py-20 rounded-[24px] border border-white/5 bg-black/5 max-w-xl mx-auto p-6">
                  <p className="text-xs text-zinc-500 font-bold">No published vectors rendering yet on this node.</p>
                  <button
                    onClick={() => onNavigate("create")}
                    className={`mt-4 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-lg ${theme.accent}`}
                  >
                    Deploy First Vector
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myCreatedPrompts.map((p) => (
                    <div key={p.id} className="relative group">
                      <PromptCard
                        prompt={p}
                        onSelect={onSelectPrompt}
                        onLike={onLikePrompt}
                        onSave={onSavePrompt}
                        isLikedByUser={likedPromptIds.includes(p.id)}
                        isSavedByUser={savedPromptIds.includes(p.id)}
                        userId={currentUser.id}
                      />
                      
                      {/* Interactive hover delete node icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="absolute bottom-4 left-4 p-2.5 bg-red-500/10 hover:bg-red-500 text-red-550 hover:text-white border border-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 z-30 cursor-pointer shadow-md"
                        title="Delete from space"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div>
              {mySavedPrompts.length === 0 ? (
                <div className="text-center py-20 rounded-[24px] border border-white/5 bg-black/5 max-w-xl mx-auto p-6">
                  <p className="text-xs text-zinc-500 font-bold">No saved vector blueprints bookmarked.</p>
                  <button
                    onClick={() => onNavigate("home")}
                    className="mt-4 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border border-purple-500/20 text-purple-400 hover:bg-purple-500/5 transition cursor-pointer"
                  >
                    Examine Stream
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 font-sans">
                  {mySavedPrompts.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      onSelect={onSelectPrompt}
                      onLike={onLikePrompt}
                      onSave={onSavePrompt}
                      isLikedByUser={likedPromptIds.includes(p.id)}
                      isSavedByUser={savedPromptIds.includes(p.id)}
                      userId={currentUser.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

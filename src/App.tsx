import { useState, useEffect, MouseEvent } from "react";
import FloatingParticles from "./components/FloatingParticles";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import HomeFeed from "./views/HomeFeed";
import SearchPage from "./views/SearchPage";
import CreatePrompt from "./views/CreatePrompt";
import PromptDetails from "./views/PromptDetails";
import UserProfile from "./views/UserProfile";
import NotificationsPage from "./views/NotificationsPage";
import AdminPanel from "./views/AdminPanel";
import AdminLogin from "./views/AdminLogin";
import LoginPortal from "./views/LoginPortal";
import OrderForm from "./views/OrderForm";
import { Prompt, UserProfile as UserProfileType } from "./types";
import { THEMES, ThemeConfig, ThemeName } from "./theme";
import { Sparkles } from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<UserProfileType | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [likedPromptIds, setLikedPromptIds] = useState<string[]>([]);
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme Management Engine
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("promptverse_theme");
    return (saved as ThemeName) || "midnight";
  });
  
  const currentTheme = THEMES[currentThemeName] || THEMES.midnight;

  const handleSelectTheme = (themeId: ThemeName) => {
    setCurrentThemeName(themeId);
    localStorage.setItem("promptverse_theme", themeId);
  };

  // Dynamic state fetching functions
  const fetchAllPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error("Failed to fetch prompts from Express ledger:", err);
    }
  };

  const fetchNotificationCounts = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to load notifications counts:", err);
    }
  };

  // Run on startup
  useEffect(() => {
    const restoredUser = localStorage.getItem("promptverse_user_profile");
    if (restoredUser) {
      try {
        setCurrentUser(JSON.parse(restoredUser));
      } catch (err) {
        console.error("Failed parsing login details from local storage:", err);
      }
    }
    fetchAllPrompts();

    // Direct browser URL interception for separate Admin Login page
    if (window.location.pathname === "/admin/login" || window.location.hash === "#/admin/login" || window.location.pathname.startsWith("/admin")) {
      setActiveView("admin-login");
    }

    // Register a global listener for component level toasts
    const handleGlobalToast = (e: any) => {
      if (e.detail && e.detail.message) {
        showToast(e.detail.message);
      }
    };
    window.addEventListener("promptverse-toast", handleGlobalToast);
    return () => window.removeEventListener("promptverse-toast", handleGlobalToast);
  }, []);

  // Sync parameters whenever current user profiles change
  useEffect(() => {
    if (currentUser) {
      const storedLikes = localStorage.getItem(`promptverse_likes_${currentUser.id}`);
      const storedSaves = localStorage.getItem(`promptverse_saves_${currentUser.id}`);
      if (storedLikes) setLikedPromptIds(JSON.parse(storedLikes));
      if (storedSaves) setSavedPromptIds(JSON.parse(storedSaves));
      fetchNotificationCounts();
    } else {
      setLikedPromptIds([]);
      setSavedPromptIds([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Interactive endpoints support triggers
  const handleLikePrompt = async (promptId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setActiveView("login");
      return;
    }

    try {
      const res = await fetch(`/api/prompts/${promptId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        const nextLikes = data.liked 
          ? [...likedPromptIds, promptId] 
          : likedPromptIds.filter((id) => id !== promptId);
        
        setLikedPromptIds(nextLikes);
        localStorage.setItem(`promptverse_likes_${currentUser.id}`, JSON.stringify(nextLikes));
        
        showToast(data.liked ? "✨ Endorsement stored." : "Endorsement retracted.");
        fetchAllPrompts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePrompt = async (promptId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setActiveView("login");
      return;
    }

    try {
      const res = await fetch(`/api/prompts/${promptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        const nextSaves = data.saved 
          ? [...savedPromptIds, promptId] 
          : savedPromptIds.filter((id) => id !== promptId);
        
        setSavedPromptIds(nextSaves);
        localStorage.setItem(`promptverse_saves_${currentUser.id}`, JSON.stringify(nextSaves));
        
        showToast(data.saved ? "✨ Bookmarked into Matrix Folder." : "Bookmark cleared.");
        fetchAllPrompts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (newPromptData: any): Promise<Prompt> => {
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPromptData)
    });

    if (!res.ok) {
      throw new Error("Publish transaction rejected.");
    }

    const created = await res.json();
    fetchAllPrompts();
    showToast("✨ Prompt successfully uploaded to feed!");
    return created;
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAllPrompts();
        showToast("Prompt erased successfully.");
        if (activeView === `prompt-${promptId}`) {
          setActiveView("home");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (updatedFields: any): Promise<UserProfileType> => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields)
    });

    if (!res.ok) {
      throw new Error("Failed to update profile nodes.");
    }

    const data = await res.json();
    setCurrentUser(data);
    localStorage.setItem("promptverse_user_profile", JSON.stringify(data));
    showToast("✨ Profile details successfully stored.");
    fetchAllPrompts();
    return data;
  };

  const handleLogout = () => {
    localStorage.removeItem("promptverse_user_profile");
    localStorage.removeItem("promptverse_token");
    setCurrentUser(null);
    setActiveView("home");
    showToast("Session disconnected.");
  };

  const isDark = currentTheme.id !== "arctic";

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.bg} font-sans antialiased ${currentTheme.textPrimary} transition-colors duration-500 relative overflow-x-hidden`}>
      
      {/* Dynamic ambient background glow */}
      {currentTheme.glow !== "none" && (
        <div 
          className="absolute top-0 inset-x-0 h-[450px] pointer-events-none z-0 transition-opacity duration-500" 
          style={{
            backgroundImage: currentTheme.glow,
          }}
        />
      )}

      {/* Dynamic floating geometric particles */}
      <FloatingParticles />

      {/* Primary Top Header Controller with Theme Selector (Hidden on Home, Search, Create views) */}
      {activeView !== "home" && activeView !== "search" && activeView !== "create" && (
        <Navbar
          activeView={activeView}
          onNavigate={setActiveView}
          currentUser={currentUser}
          onLogout={handleLogout}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
        />
      )}

      {/* Main viewport panels router container */}
      <div className="flex-grow relative z-10">
        {activeView === "home" && (
          <HomeFeed
            prompts={prompts}
            onSelectPrompt={(id) => setActiveView(`prompt-${id}`)}
            onLikePrompt={handleLikePrompt}
            onSavePrompt={handleSavePrompt}
            likedPromptIds={likedPromptIds}
            savedPromptIds={savedPromptIds}
            currentUser={currentUser}
            onNavigate={setActiveView}
            theme={currentTheme}
          />
        )}

        {activeView === "search" && (
          <SearchPage
            prompts={prompts}
            onSelectPrompt={(id) => setActiveView(`prompt-${id}`)}
            onLikePrompt={handleLikePrompt}
            onSavePrompt={handleSavePrompt}
            likedPromptIds={likedPromptIds}
            savedPromptIds={savedPromptIds}
            currentUser={currentUser}
            theme={currentTheme}
          />
        )}

        {activeView === "create" && (
          <CreatePrompt
            currentUser={currentUser}
            onNavigate={setActiveView}
            onPublish={handlePublish}
            theme={currentTheme}
          />
        )}

        {activeView.startsWith("prompt-") && (
          <PromptDetails
            promptId={activeView.replace("prompt-", "")}
            onBack={() => setActiveView("home")}
            currentUser={currentUser}
            onNavigate={setActiveView}
            onLikePrompt={handleLikePrompt}
            onSavePrompt={handleSavePrompt}
            likedPromptIds={likedPromptIds}
            savedPromptIds={savedPromptIds}
            allPrompts={prompts}
          />
        )}

        {activeView === "profile" && (
          <UserProfile
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            prompts={prompts}
            onSelectPrompt={(id) => setActiveView(`prompt-${id}`)}
            onLikePrompt={handleLikePrompt}
            onSavePrompt={handleSavePrompt}
            likedPromptIds={likedPromptIds}
            savedPromptIds={savedPromptIds}
            onNavigate={setActiveView}
            onDeletePrompt={handleDeletePrompt}
            theme={currentTheme}
            onSelectTheme={handleSelectTheme}
            currentThemeName={currentThemeName}
          />
        )}

        {activeView === "notifications" && (
          <NotificationsPage
            currentUser={currentUser}
            onNavigate={setActiveView}
            onSelectPrompt={(id) => setActiveView(`prompt-${id}`)}
          />
        )}

        {activeView === "admin" && (
          <AdminPanel
            currentUser={currentUser}
            allPrompts={prompts}
            onSelectPrompt={(id) => setActiveView(`prompt-${id}`)}
            onDeletePrompt={handleDeletePrompt}
            onNavigate={setActiveView}
          />
        )}

        {activeView === "admin-login" && (
          <AdminLogin
            onLoginSuccess={setCurrentUser}
            onNavigate={setActiveView}
          />
        )}

        {activeView === "login" && (
          <LoginPortal
            onLoginSuccess={setCurrentUser}
            onNavigate={setActiveView}
          />
        )}

        {activeView === "checkout" && (
          <OrderForm 
            theme={currentTheme}
            onNavigate={setActiveView}
          />
        )}
      </div>

      {/* Floating tactile toasts */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50">
          <div className={`flex items-center space-x-2 rounded-2xl border ${currentTheme.border} ${currentTheme.cardBg} px-5 py-3 shadow-2xl backdrop-blur-xl`}>
            <Sparkles className="h-4.5 w-4.5 text-indigo-400 rotate-12" />
            <span className={`text-xs font-black uppercase tracking-wide`}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating iOS style Dynamic Island bottom pill navigator */}
      <BottomNav
        activeView={activeView}
        onNavigate={setActiveView}
        currentUser={currentUser}
        theme={currentTheme}
      />

    </div>
  );
}

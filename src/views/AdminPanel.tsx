import { useState, useEffect } from "react";
import { 
  ShieldAlert, BarChart3, Users, FileText, Heart, Shield,
  MessageSquare, Sparkles, Check, Trash2, ArrowUpRight, 
  Settings as SettingsIcon, Image as ImageIcon, FolderTree, Plus, Edit3, X, Ban, UserCheck, RefreshCw, Upload
} from "lucide-react";
import { UserProfile, Prompt } from "../types";

interface AdminPanelProps {
  currentUser: UserProfile | null;
  allPrompts: Prompt[];
  onSelectPrompt: (promptId: string) => void;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onNavigate: (view: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
  coverImage: string;
}

export default function AdminPanel({
  currentUser,
  allPrompts,
  onSelectPrompt,
  onDeletePrompt,
  onNavigate
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "prompts" | "images" | "users" | "categories" | "settings">("analytics");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // CRUD State variables
  const [promptsList, setPromptsList] = useState<Prompt[]>(allPrompts);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchPromptQuery, setSearchPromptQuery] = useState("");

  // Category Edit and Add state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryCover, setCategoryCover] = useState("");

  // Prompt Editing states
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editPromptTitle, setEditPromptTitle] = useState("");
  const [editPromptContent, setEditPromptContent] = useState("");
  const [editPromptCategory, setEditPromptCategory] = useState("");

  // Settings Configuration states
  const [enableParticles, setEnableParticles] = useState(true);
  const [restrictPublishingToPro, setRestrictPublishingToPro] = useState(false);

  const loadAdminMetrics = async () => {
    if (!currentUser || currentUser.role !== "admin") return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setReports(data.reports || []);
      }

      // Fetch users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }

      // Fetch categories
      const catRes = await fetch("/api/admin/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategoriesList(catData);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Matrix connection failed. Rebooting overrides...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, [currentUser, allPrompts]);

  useEffect(() => {
    setPromptsList(allPrompts);
  }, [allPrompts]);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl py-24 px-4 text-center text-zinc-400">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Restricted Administration Core</h2>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Security policy prevents unauthorized cadets from reading analytical states or modifying prompt templates. Please login with level-5 supervisor credentials.
        </p>
        <button
          onClick={() => onNavigate("login")}
          className="mt-6 px-6 py-2.5 rounded-full text-xs font-bold uppercase bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
        >
          Verify Credentials
        </button>
      </div>
    );
  }

  // Flash Feedback trigger
  const showFlash = (msg: string) => {
    setPanelMessage(msg);
    setTimeout(() => setPanelMessage(""), 3500);
  };

  // Moderation Handlers
  const handleToggleFeature = async (promptId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/prompts/${promptId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentStatus })
      });

      if (res.ok) {
        showFlash("✨ Featured blueprint toggle synced.");
        loadAdminMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminNuke = async (promptId: string) => {
    if (confirm("NUKE: Delete this blueprint permanently from both memory stream + databases?")) {
      try {
        await onDeletePrompt(promptId);
        showFlash("🗑️ Blueprint destroyed from databases.");
        loadAdminMetrics();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Category CRUD Execution
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName, coverImage: categoryCover })
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName, coverImage: categoryCover })
        });
      }

      if (res.ok) {
        showFlash(editingCategory ? "⚡ Category updated." : "✅ New category registered.");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setCategoryName("");
        setCategoryCover("");
        loadAdminMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (confirm("Delete this category from selection sets? Saved prompts remain general.")) {
      try {
        const res = await fetch(`/api/admin/categories/${catId}`, { method: "DELETE" });
        if (res.ok) {
          showFlash("🗑️ Category removed.");
          loadAdminMetrics();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // User Moderation Execution
  const handleToggleUserBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: !currentlyBanned })
      });
      if (res.ok) {
        showFlash(!currentlyBanned ? "🚫 Space traveler suspended." : "🔓 Traveler permissions restored.");
        loadAdminMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserAdmin = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        showFlash(`👑 Security role changed to ${nextRole}.`);
        loadAdminMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("ERASE CITIZEN: Are you sure you want to delete this explorer portfolio permanently?")) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
          showFlash("🗑️ Portfolio profile erased.");
          loadAdminMetrics();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Prompt Editing Execution
  const handleSavePromptEdit = async () => {
    if (!editingPrompt) return;
    try {
      const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editPromptTitle,
          content: editPromptContent,
          category: editPromptCategory
        })
      });

      if (res.ok) {
        showFlash("⚡ Blueprint instructions modified.");
        setEditingPrompt(null);
        loadAdminMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter lists based on search
  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(searchUserQuery.toLowerCase().trim()) ||
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase().trim())
  );

  const filteredPrompts = promptsList.filter(p => 
    p.title.toLowerCase().includes(searchPromptQuery.toLowerCase().trim()) ||
    p.content.toLowerCase().includes(searchPromptQuery.toLowerCase().trim()) ||
    p.category.toLowerCase().includes(searchPromptQuery.toLowerCase().trim())
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-32 text-zinc-101 text-left min-h-screen">
      
      {panelMessage && (
        <div className="mb-6 rounded-[16px] border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-bold text-emerald-400">
          {panelMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-[16px] border border-red-500/25 bg-red-950/20 p-4 text-xs font-bold text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Header Panel */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-black uppercase text-white flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span>HQ Supervision Core</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Full-stack database governance, asset auditing, & category editor.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAdminMetrics}
            className="flex items-center space-x-1.5 px-4 py-2 border border-white/10 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-350 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Re-verify Sync</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs bar */}
      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-8 overflow-x-auto scrollbar-none">
        {[
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "prompts", label: "Prompts", icon: FileText },
          { id: "images", label: "Images", icon: ImageIcon },
          { id: "users", label: "Users", icon: Users },
          { id: "categories", label: "Categories", icon: FolderTree },
          { id: "settings", label: "Settings", icon: SettingsIcon }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition select-none cursor-pointer ${
                isActive 
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20" 
                  : "text-zinc-600 hover:text-zinc-350"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Querying DB Shards...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Metric grid */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-5 rounded-[24px] border border-white/5 bg-black/15 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Database Models</span>
                    <h3 className="text-2xl font-black font-mono text-white">{stats.totalPrompts}</h3>
                  </div>

                  <div className="p-5 rounded-[24px] border border-white/5 bg-black/15 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Active Citizens</span>
                    <h3 className="text-2xl font-black font-mono text-white">{stats.totalUsers}</h3>
                  </div>

                  <div className="p-5 rounded-[24px] border border-white/5 bg-black/15 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Discussions</span>
                    <h3 className="text-2xl font-black font-mono text-white">{stats.totalComments}</h3>
                  </div>

                  <div className="p-5 rounded-[24px] border border-white/5 bg-black/15 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Likes Cast</span>
                    <h3 className="text-2xl font-black font-mono text-white">{stats.totalLikes}</h3>
                  </div>

                  <div className="p-5 rounded-[24px] border border-white/5 bg-black/15 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#c084fc]">Copies Logged</span>
                    <h3 className="text-2xl font-black font-mono text-purple-400">{stats.totalCopies}</h3>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Reports Moderation Registry */}
                <section className="lg:col-span-6 rounded-[24px] border border-white/5 bg-black/10 p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase text-rose-455 tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="h-4.5 w-4.5" />
                    <span>Explorer Integrity Reports ({reports.length})</span>
                  </h3>

                  <div className="space-y-3">
                    {reports.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">Integrity register clean. Zero complaints logged.</p>
                    ) : (
                      reports.map((rep) => (
                        <div key={rep.id} className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-start justify-between gap-3">
                          <div className="text-left space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-zinc-550 block">REPORT {rep.id} on model {rep.promptId}</span>
                            <p className="text-xs text-zinc-300">"Reason: <span className="font-extrabold text-red-300 italic">{rep.reason}</span>"</p>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => onSelectPrompt(rep.promptId)}
                              className="p-1.5 px-3 bg-white/5 text-[9px] font-black uppercase border border-white/5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleAdminNuke(rep.promptId)}
                              className="p-1.5 bg-rose-650/15 hover:bg-rose-600 text-rose-400 hover:text-white rounded-full border border-rose-500/10 cursor-pointer"
                              title="Delete immediately"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Popular Prompts */}
                <section className="lg:col-span-6 rounded-[24px] border border-white/5 bg-black/10 p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>Hot Vectors Ranked List</span>
                  </h3>

                  <div className="space-y-3">
                    {stats?.promptPopularity?.map((item: any, i: number) => (
                      <div key={item.id} className="p-3 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <img src={item.coverImage} className="h-10 w-10 rounded-lg object-cover bg-zinc-950 shrink-0" />
                          <div className="text-left overflow-hidden">
                            <h4 className="text-xs font-black text-white truncate max-w-[200px]">{item.title}</h4>
                            <span className="text-[9px] text-zinc-550 font-bold block">Rank #{i + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-mono shrink-0">
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] text-zinc-550 uppercase font-black">Copies</span>
                            <span className="text-purple-400 font-extrabold">{item.copies}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPTS LIST governance */}
          {activeTab === "prompts" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Filter vectors by keywords, category..."
                  value={searchPromptQuery}
                  onChange={(e) => setSearchPromptQuery(e.target.value)}
                  className="w-full rounded-full border border-white/5 bg-black/10 px-5 py-3 text-xs text-white outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Editing Prompt Modal overlay */}
              {editingPrompt && (
                <div className="rounded-[24px] border border-purple-500/30 bg-purple-950/15 p-6 space-y-4 max-w-xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#d8b4fe]">Edit Blueprint Override Schema</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] font-black uppercase text-zinc-500">Title Header</span>
                      <input
                        type="text"
                        value={editPromptTitle}
                        onChange={(e) => setEditPromptTitle(e.target.value)}
                        className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] font-black uppercase text-zinc-500">Category Allocation</span>
                      <input
                        type="text"
                        value={editPromptCategory}
                        onChange={(e) => setEditPromptCategory(e.target.value)}
                        className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] font-black uppercase text-zinc-500">System Instruction Recipe</span>
                      <textarea
                        value={editPromptContent}
                        onChange={(e) => setEditPromptContent(e.target.value)}
                        rows={5}
                        className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs font-mono text-zinc-300 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSavePromptEdit}
                      className="px-5 py-2 rounded-full text-[10px] font-black uppercase bg-purple-650 text-white cursor-pointer"
                    >
                      Sync Changes
                    </button>
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="px-5 py-2 rounded-full text-[10px] font-bold uppercase border border-white/10 text-zinc-400 cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Prompts table list */}
              <div className="rounded-[24px] border border-white/5 bg-black/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase text-[9px] tracking-wider select-none bg-black/5">
                        <th className="p-4">Cover</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Publisher</th>
                        <th className="p-4 text-center">Featured status</th>
                        <th className="p-4 text-right">Moderations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrompts.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition duration-150">
                          <td className="p-4 shrink-0">
                            <img src={p.coverImage} className="h-10 w-16 rounded-lg object-cover bg-zinc-950 shrink-0" />
                          </td>
                          <td className="p-4 font-bold text-zinc-150 max-w-sm truncate">{p.title}</td>
                          <td className="p-4 text-zinc-550 font-bold">{p.category}</td>
                          <td className="p-4 font-semibold text-purple-400">@{p.creatorName}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block py-0.5 px-2 text-[8px] font-black tracking-widest uppercase rounded ${
                              p.isFeatured ? "bg-purple-650/20 text-purple-400 border border-purple-500/20" : "bg-zinc-800 text-zinc-550"
                            }`}>
                              {p.isFeatured ? "Featured" : "Regular"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5 matches-box">
                              <button
                                onClick={() => {
                                  setEditingPrompt(p);
                                  setEditPromptTitle(p.title);
                                  setEditPromptCategory(p.category);
                                  setEditPromptContent(p.content);
                                }}
                                className="p-1 bg-white/5 text-xs rounded border border-white/5 hover:bg-white/10 text-zinc-300"
                                title="Edit blueprint"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleFeature(p.id, p.isFeatured)}
                                className="p-1 bg-white/5 text-xs rounded border border-white/5 hover:bg-white/10 text-purple-450 uppercase text-[9px] font-black tracking-widest px-2"
                              >
                                Promote Status
                              </button>
                              <button
                                onClick={() => handleAdminNuke(p.id)}
                                className="p-1.5 bg-rose-950/20 text-rose-450 hover:bg-rose-500 hover:text-white rounded border border-rose-500/10 cursor-pointer"
                                title="Nuke item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES Auditing & Replacing */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase text-zinc-150">Asset Repository Index</h3>
                <p className="text-xs text-zinc-550">Review, audit and delete cover image elements broadcasted in Supabase ledger.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {promptsList.map((p) => (
                  <div key={p.id} className="relative group rounded-3xl border border-white/5 overflow-hidden bg-black/10 aspect-[4/3]">
                    <img src={p.coverImage} className="h-full w-full object-cover" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-3.5">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleAdminNuke(p.id)}
                          className="p-1 px-2.5 rounded bg-rose-600 font-extrabold hover:bg-rose-500 text-white text-[10px] uppercase flex items-center space-x-1 shadow-md cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> <span>Erase</span>
                        </button>
                      </div>
                      
                      <div className="text-left">
                        <h4 className="text-[10px] font-black text-white truncate max-w-full">Prompt Ref: {p.id}</h4>
                        <span className="text-[9px] text-[#a855f7] font-black block tracking-wide uppercase truncate">@{p.creatorName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS MODERATION */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Search user */}
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Search explorers by username, alias records..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full rounded-full border border-white/5 bg-black/10 px-5 py-3 text-xs text-white outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Users grid list */}
              <div className="rounded-[24px] border border-white/5 bg-black/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase text-[9px] tracking-wider bg-black/5 select-none">
                        <th className="p-4">Explorer</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Authority Status</th>
                        <th className="p-4">Permissions Badges</th>
                        <th className="p-4 text-right">Moderations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4 flex items-center space-x-3">
                            <img src={u.avatar} className="h-9 w-9 rounded-full object-cover border border-white/15" />
                            <div className="text-left">
                              <span className="text-xs font-black text-white block">@{u.username}</span>
                              <span className="text-[9px] text-zinc-550 font-bold">UID: {u.id}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-zinc-450">{u.email}</td>
                          <td className="p-4">
                            <span className={`inline-block py-0.5 px-2 text-[8px] font-black uppercase tracking-widest rounded ${
                              u.role === "admin" ? "bg-indigo-650/20 text-indigo-400 border border-indigo-500/20" : "bg-neutral-800 text-zinc-550"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {u.badge?.map((b: string) => (
                                <span key={b} className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-950/40 text-purple-400 border border-purple-500/10 uppercase tracking-wide">{b}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Suspend / Ban button */}
                              <button
                                onClick={() => handleToggleUserBan(u.id, u.banned)}
                                className={`p-1.5 rounded flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 transition ${
                                  u.banned 
                                    ? "bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-600 hover:text-white" 
                                    : "bg-red-950/20 border border-red-500/15 text-red-400 hover:bg-red-600 hover:text-white"
                                }`}
                              >
                                {u.banned ? <UserCheck className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                <span>{u.banned ? "Reinstate" : "Ban Node"}</span>
                              </button>

                              {/* Promoting user to admin */}
                              <button
                                onClick={() => handleToggleUserAdmin(u.id, u.role)}
                                className="p-1 px-2.5 text-xs rounded border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold"
                              >
                                Toggle Admin
                              </button>

                              {/* Erasing user */}
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded bg-rose-950/20 border border-rose-500/10 text-rose-455 hover:bg-rose-500 hover:text-white cursor-pointer"
                                title="Obliterate citizens record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES CURATION */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase text-zinc-150">Selection Folders</h3>
                  <p className="text-xs text-zinc-550">Create and curate global category maps available in search indexes.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategoryCover("");
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-full bg-purple-650 hover:bg-purple-605 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-900/10 cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Create Category</span>
                </button>
              </div>

              {/* Category creation panel */}
              {isCategoryModalOpen && (
                <div className="rounded-[24px] border border-purple-500/30 bg-purple-950/15 p-6 space-y-4 max-w-xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#d8b4fe]">
                    {editingCategory ? "Upgrade Category Ledger" : "Broadcast Category Map"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-zinc-500">Folder Name</span>
                      <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. ChatGPT, Gemini..."
                        className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-zinc-500">Cover Image URL</span>
                      <input
                        type="text"
                        value={categoryCover}
                        onChange={(e) => setCategoryCover(e.target.value)}
                        placeholder="Image URL link"
                        className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSaveCategory}
                      className="px-5 py-2 rounded-full text-[10px] font-black uppercase bg-purple-650 text-white cursor-pointer"
                    >
                      Store Folder
                    </button>
                    <button
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="px-5 py-2 rounded-full text-[10px] font-bold uppercase border border-white/10 text-zinc-400 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Categories grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categoriesList.map((cat) => (
                  <div key={cat.id} className="relative group h-32 rounded-[24px] border border-white/5 overflow-hidden bg-black/5">
                    <img src={cat.coverImage} className="absolute inset-0 h-full w-full object-cover select-none" />
                    <div className="absolute inset-0 bg-black/55" />
                    
                    <div className="absolute inset-x-3 bottom-3 p-2 rounded-[16px] bg-black/50 border border-white/5 flex items-center justify-between text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[120px]">{cat.name}</span>
                      
                      <div className="flex space-x-1 shrink-0 matches-action opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryName(cat.name);
                            setCategoryCover(cat.coverImage);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1 rounded bg-white/10 text-white hover:bg-white/20 hover:scale-105"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded bg-rose-600/20 text-rose-405 border border-rose-500/10 hover:bg-rose-600 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS CONFIGURATION */}
          {activeTab === "settings" && (
            <div className="max-w-xl rounded-[24px] border border-white/5 bg-black/10 p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#d8b4fe]">Core Workspace Config overrides</h3>
              
              <div className="space-y-5">
                <label className="flex items-center justify-between p-3 bg-black/25 rounded-2xl border border-white/5 select-none cursor-pointer">
                  <div className="text-left pr-4">
                    <span className="text-xs font-black text-white block">Active Particle Engine</span>
                    <span className="text-[10px] text-zinc-550 block leading-tight mt-0.5">Toggle dynamic micro geometric float particles in background.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableParticles}
                    onChange={(e) => setEnableParticles(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-purple-650"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-black/25 rounded-2xl border border-white/5 select-none cursor-pointer">
                  <div className="text-left pr-4">
                    <span className="text-xs font-black text-white block">Restrict Publishing to verified authors</span>
                    <span className="text-[10px] text-zinc-550 block leading-tight mt-0.5">Only allow vetted profiles to deploy new prompts templates to the stream.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={restrictPublishingToPro}
                    onChange={(e) => setRestrictPublishingToPro(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-purple-650"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-white/5 text-left">
                <button
                  onClick={() => showFlash("✨ Configurations updated in stream.")}
                  className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-purple-650 hover:bg-purple-600 text-white cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

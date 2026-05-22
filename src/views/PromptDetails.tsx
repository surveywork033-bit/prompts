import { useState, useEffect, MouseEvent, FormEvent } from "react";
import { Heart, Bookmark, Eye, Copy, Check, Calendar, ArrowLeft, ArrowUpRight, MessageSquare, Flame, Send, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { Prompt, Comment, UserProfile } from "../types";

interface PromptDetailsProps {
  promptId: string;
  onBack: () => void;
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  onLikePrompt: (promptId: string, e: MouseEvent) => void;
  onSavePrompt: (promptId: string, e: MouseEvent) => void;
  likedPromptIds: string[];
  savedPromptIds: string[];
  allPrompts: Prompt[];
}

export default function PromptDetails({
  promptId,
  onBack,
  currentUser,
  onNavigate,
  onLikePrompt,
  onSavePrompt,
  likedPromptIds,
  savedPromptIds,
  allPrompts
}: PromptDetailsProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const loadPromptDetails = async () => {
    try {
      // 1. Fetch details and increment views from db
      const pRes = await fetch(`/api/prompts/${promptId}`);
      if (!pRes.ok) throw new Error("Failed to load prompt details node");
      const pData = await pRes.json();
      setPrompt(pData);

      // 2. Fetch comments from db
      const cRes = await fetch(`/api/prompts/${promptId}/comments`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setComments(cData);
      }

      // 3. Fetch author follow metadata
      const authorId = pData.creatorId;
      const uRes = await fetch(`/api/user/profile/${authorId}`);
      if (uRes.ok) {
        const uData = await uRes.json();
        setFollowersCount(uData.followersCount || 0);
      }

      // Check follow state if logged in
      if (currentUser) {
        // Find if user already follows
        const savedFollows = localStorage.getItem(`promptverse_follow_${currentUser.id}_${authorId}`);
        setIsFollowing(savedFollows === "true");
      }

    } catch (err) {
      console.error("Failed to load prompt node detail stream", err);
    }
  };

  useEffect(() => {
    loadPromptDetails();
    // Scroll to top of panel view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [promptId]);

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failure:", err);
    }
  };

  const handleLike = async (e: MouseEvent) => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }
    await onLikePrompt(promptId, e);
    // Reload metrics
    loadPromptDetails();
  };

  const handleSave = async (e: MouseEvent) => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }
    await onSavePrompt(promptId, e);
    // Reload metrics
    loadPromptDetails();
  };

  const handleFollow = async () => {
    if (!currentUser || !prompt) {
      onNavigate("login");
      return;
    }

    try {
      const res = await fetch(`/api/users/${prompt.creatorId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        setFollowersCount(data.followersCount);
        localStorage.setItem(`promptverse_follow_${currentUser.id}_${prompt.creatorId}`, String(data.following));
      }
    } catch (err) {
      console.error("Follow toggling failed:", err);
    }
  };

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/prompts/${promptId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: newCommentText.trim()
        })
      });

      if (res.ok) {
        setNewCommentText("");
        // Reload details to get new comment
        loadPromptDetails();
      }
    } catch (err) {
      console.error("Post comment failed:", err);
    }
  };

  const handleFileReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !prompt) return;

    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          reporterId: currentUser.id,
          reason: reportReason.trim()
        })
      });

      if (res.ok) {
        setReportSubmitted(true);
        setReportReason("");
        setTimeout(() => {
          setShowReportForm(false);
          setReportSubmitted(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Reporting failed:", err);
    }
  };

  if (!prompt) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-zinc-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-4" />
        <span className="text-xs font-mono">Initializing Prompt Node Matrix...</span>
      </div>
    );
  }

  // Related prompts based on similarity in categories
  const relatedList = allPrompts
    .filter((p) => p.category === prompt.category && p.id !== prompt.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12 text-zinc-105 text-left">
      
      {/* Back button header navigation bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-450 hover:text-white transition group py-1.5 px-3.5 border border-zinc-850/80 bg-zinc-900/10 hover:bg-zinc-900/40 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit Details</span>
        </button>

        <span className="text-[10px] font-mono text-zinc-650 uppercase">
          Node ID: {prompt.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column Area (8 cols) - Large details banner */}
        <main className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Cover Hero section */}
          <div className="relative overflow-hidden aspect-[16/9] w-full rounded-2xl border border-zinc-850 bg-zinc-950">
            <img
              src={prompt.coverImage}
              alt={prompt.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <div className="inline-flex items-center space-x-1 border border-purple-500/30 bg-purple-950/60 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-400 backdrop-blur-sm">
                <Flame className="h-3.5 w-3.5" />
                <span>{prompt.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3.5xl font-extrabold text-white text-shadow-md">
                {prompt.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                {prompt.description}
              </p>
            </div>
          </div>

          {/* Prompt Blueprint with elegant copy block */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 backdrop-blur-md space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2 text-zinc-400">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Engineered Prompt Recipe</span>
              </div>

              {/* COPY TRIGGER */}
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 p-1.5 px-3.5 rounded-xl bg-purple-650 hover:bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-950/20 active:scale-[0.98] transition"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300 animate-bounce" />
                    <span>COPIED TO SLOTS!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>COPY PROMPT</span>
                  </>
                )}
              </button>
            </div>

            <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-[11px] sm:text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-all border border-zinc-900 overflow-x-auto selection:bg-purple-600/30">
              {prompt.content}
            </pre>

            <span className="text-[10px] text-zinc-550 italic font-mono block">
              💡 Hint: Copy the prompt and insert your targets inside the placeholders marked in brackets.
            </span>
          </div>

          {/* Social dialogue discussion system */}
          <section className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-bold tracking-wider text-zinc-350 uppercase flex items-center space-x-1.5 border-b border-zinc-905 pb-3">
              <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
              <span>Discussion Dialogue ({comments.length})</span>
            </h3>

            {/* Comment Post form */}
            {currentUser ? (
              <form onSubmit={handlePostComment} className="flex gap-3 items-end">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover border border-zinc-800"
                />
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Enter discussion argument..."
                    className="w-full text-xs rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-3.5 pr-10 outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1.5 text-purple-400 hover:text-white transition"
                    title="Send comment"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-lg text-center">
                <span className="text-[11px] text-zinc-500 font-medium">Please <span onClick={() => onNavigate("login")} className="text-purple-400 underline cursor-pointer">Sign In</span> to participate in the conversation.</span>
              </div>
            )}

            {/* Comments List display */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <span className="text-xs text-zinc-600 block italic">No dialogue threads active yet</span>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="flex space-x-3 text-xs text-left border-b border-zinc-900/30 pb-3">
                    <img
                      src={comm.userAvatar}
                      alt={comm.userName}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-lg object-cover border border-zinc-800"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-300">@{comm.userName}</span>
                        <span className="text-[9px] text-zinc-650 font-mono">
                          {new Date(comm.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </section>

        </main>

        {/* Right Column Area (4 cols) - Stats and Creator info */}
        <aside className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Host Creator info card */}
          <section className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 backdrop-blur-md space-y-4">
            
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block border-b border-zinc-900 pb-2">
              CREATOR ARCHITECT
            </span>

            <div className="flex items-center space-x-3.5">
              <img
                src={prompt.creatorAvatar}
                alt={prompt.creatorName}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-xl object-cover border border-zinc-800 ring-2 ring-purple-600/10"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-1.5 text-zinc-150 font-bold">
                  <span>@{prompt.creatorName}</span>
                  {prompt.creatorVerified && (
                    <UserCheck className="h-4 w-4 text-purple-400" title="Verified Creator" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">
                  {followersCount} Followers
                </span>
              </div>
            </div>

            {/* Follow buttons */}
            <button
              onClick={handleFollow}
              className={`w-full py-2 text-xs font-bold tracking-wider rounded-xl transition ${
                isFollowing
                  ? "border border-zinc-800 bg-zinc-850 text-zinc-400 hover:text-white"
                  : "bg-purple-650 hover:bg-purple-600 text-white shadow-md shadow-purple-950/15"
              }`}
            >
              {isFollowing ? "UNFOLLOW CREATOR" : "FOLLOW CREATOR"}
            </button>

          </section>

          {/* Social Node parameters (likes/saves/stats) */}
          <section className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 backdrop-blur-md space-y-3 px-6">
            
            <div className="flex items-center justify-between py-1 text-sm border-b border-zinc-900/50">
              <span className="text-zinc-500 text-xs font-bold">Total Views</span>
              <span className="font-mono text-zinc-300 flex items-center space-x-1">
                <Eye className="h-4 w-4 text-zinc-500 mr-1" />
                <span>{prompt.viewsCount}</span>
              </span>
            </div>

            {/* Like */}
            <div className="flex items-center justify-between py-1 text-sm border-b border-zinc-900/50">
              <span className="text-zinc-500 text-xs font-bold">Endorsement Votes</span>
              <button
                onClick={handleLike}
                className="flex items-center space-x-1.5 hover:text-white transition"
              >
                <Heart
                  className={`h-4.5 w-4.5 ${
                    likedPromptIds.includes(prompt.id) ? "fill-purple-500 text-purple-500" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                />
                <span className="font-mono text-zinc-300">{prompt.likesCount} Likes</span>
              </button>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between py-1 text-sm border-b border-zinc-900/50">
              <span className="text-zinc-500 text-xs font-bold">Safekeeping Bookmark</span>
              <button
                onClick={handleSave}
                className="flex items-center space-x-1.5 hover:text-white transition"
              >
                <Bookmark
                  className={`h-4.5 w-4.5 ${
                    savedPromptIds.includes(prompt.id) ? "fill-purple-500 text-purple-500" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                />
                <span className="font-mono text-zinc-300">{prompt.savesCount} Bookmarks</span>
              </button>
            </div>

            {/* Created time */}
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-zinc-500 text-xs font-bold">Shared Date</span>
              <span className="font-mono text-zinc-400 text-xs flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-550 mr-1" />
                <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
              </span>
            </div>

          </section>

          {/* Prompt Moderation panel (Flags/Reports) */}
          <section className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 backdrop-blur-md text-left">
            {!showReportForm ? (
              <button
                onClick={() => setShowReportForm(true)}
                className="text-[11px] font-bold text-rose-450 hover:text-rose-400 tracking-wider flex items-center space-x-1 uppercase"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Report Prompt Integrity</span>
              </button>
            ) : (
              <form onSubmit={handleFileReport} className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-450 uppercase block">Trace Integrity Issue</span>
                {reportSubmitted ? (
                  <span className="text-xs text-emerald-400 block italic font-semibold">Report successfully filed to admin desk.</span>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="e.g. Broken links, placeholder text, copy..."
                      className="w-full text-xs rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 outline-none focus:border-purple-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="py-1 px-2.5 rounded bg-rose-550 hover:bg-rose-600 text-[10px] font-bold text-white transition"
                      >
                        File Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="py-1 px-2.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </section>

          {/* Related System Prompts List */}
          {relatedList.length > 0 && (
            <section className="rounded-2xl border border-zinc-850 p-5 space-y-3.5 text-left">
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block">
                RELATED PROMPT SYSTEMS
              </span>

              <div className="flex flex-col space-y-3">
                {relatedList.map((relPr) => (
                  <div
                    key={relPr.id}
                    onClick={() => onNavigate(`prompt-${relPr.id}`)}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <img
                      src={relPr.coverImage}
                      alt={relPr.title}
                      referrerPolicy="no-referrer"
                      className="h-9 w-14 rounded-lg object-cover border border-zinc-800 group-hover:opacity-85 transition"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 line-clamp-1 transition">
                        {relPr.title}
                      </h4>
                      <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-mono">
                        @{relPr.creatorName}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4.5 w-4.5 text-zinc-600 group-hover:text-purple-400 transition" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </aside>

      </div>

    </div>
  );
}

import { useState, useRef, ChangeEvent } from "react";
import { Loader2, Image as ImageIcon, Sparkles, ChevronDown } from "lucide-react";
import { UserProfile, Prompt } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ThemeConfig } from "../theme";

interface CreatePromptProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  onPublish: (newPromptData: any) => Promise<Prompt>;
  theme: ThemeConfig;
}

const CATEGORIES = [
  "Trending",
  "New",
  "ChatGPT",
  "Gemini",
  "Midjourney",
  "Coding",
  "Business",
  "Marketing",
  "Education",
  "Gaming",
  "Productivity",
  "Content Creation"
];

export default function CreatePrompt({
  currentUser,
  onNavigate,
  onPublish,
  theme,
}: CreatePromptProps) {
  const [coverImage, setCoverImage] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [uploadingState, setUploadingState] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme.id !== "arctic";

  const isFormComplete = coverImage && category && content.trim();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64Str = res.split(",")[1] || res;
          resolve(base64Str);
        };
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          filetype: file.type,
          base64: base64
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      if (data.publicUrl) {
        setCoverImage(data.publicUrl);
        window.dispatchEvent(new CustomEvent("promptverse-toast", {
          detail: { message: "⚡ Render cover synced to Supabase Storage!" }
        }));
      } else {
        throw new Error("Invalid URL returned");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Network error: ${err.message || err}`);
    } finally {
      setUploadingState(false);
    }
  };

  const handlePublishSubmit = async () => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    if (!isFormComplete) return;

    setIsPublishing(false);
    setErrorMessage(null);

    // Dynamic clean titles matching content keywords organically
    const cleanWords = content.trim().split(/\s+/).filter(w => !w.startsWith("--"));
    const generatedTitle = cleanWords.slice(0, 4).join(" ") || "Infinite Vector View";
    const finalTitle = generatedTitle.length > 28 ? generatedTitle.substring(0, 27) + "..." : generatedTitle;

    try {
      setIsPublishing(true);
      const payload = {
        title: finalTitle,
        description: `Visual theme prompt, categorized under ${category}.`,
        content: content.trim(),
        category: category,
        tags: [category.toLowerCase(), "neural", "created"],
        coverImage: coverImage,
        creatorId: currentUser.id
      };

      await onPublish(payload);
      
      onNavigate("home");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Broadcast denied. Check backend server configurations.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 pb-36 text-zinc-101 text-center min-h-screen relative">
      
      {/* Floating backdrop blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 h-72 w-72 rounded-full bg-purple-600/5 blur-[90px] pointer-events-none" />

      {errorMessage && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      {!currentUser && (
        <div className="mb-6 rounded-2xl bg-purple-650/15 border border-purple-500/20 px-4 py-3 text-xs font-bold text-purple-300">
          👤 Authentication Required: Account signature is pending. Click the floating publish button to sign in.
        </div>
      )}

      <div className="space-y-8">
        
        {/* Section 1: Select Image & Device Gallery Upload Container */}
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            1. Render Canvas
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <motion.div
            onClick={handleImageClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex h-64 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed transition-all duration-300 ${
              coverImage 
                ? "border-purple-500/40 bg-zinc-950" 
                : "border-white/10 hover:border-white/20 bg-black/10 hover:bg-black/20"
            }`}
          >
            {uploadingState ? (
              <div className="flex flex-col items-center space-y-2 animate-pulse">
                <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7]">
                  Broadcasting image to Supabase...
                </span>
              </div>
            ) : coverImage ? (
              <div className="relative h-full w-full group">
                <img 
                  src={coverImage} 
                  alt="Post preview" 
                  className="h-full w-full object-cover transition duration-300 group-hover:opacity-80" 
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45">
                  <span className="rounded-full bg-white/10 backdrop-blur px-4 py-2 text-xs font-extrabold text-white">
                    Replace Vector Cover
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Device Mirror</h3>
                  <p className="text-[10.5px] text-zinc-500 mt-1">
                    Tap to open device gallery directly
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Section 2: Category Selection Dropdown */}
        <div className="space-y-2 text-left relative z-25">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            2. Allocation Space
          </label>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex w-full items-center justify-between rounded-[18px] border ${theme.border} py-4 px-5 text-sm transition-all duration-200 outline-none select-none text-left`}
              style={{
                backgroundColor: isDark ? "rgba(10, 10, 16, 0.65)" : "#ffffff",
                color: category ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#52525b" : "#94a3b8")
              }}
            >
              <span>{category || "Select Allocation Folder"}</span>
              <ChevronDown className={`h-4.5 w-4.5 text-zinc-500 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`absolute left-0 mt-2 w-full z-30 max-h-60 overflow-y-auto rounded-[20px] border p-2 shadow-2xl backdrop-blur-3xl scrollbar-none ${theme.border} ${theme.cardBg}`}
                    style={{
                      backgroundColor: isDark ? "rgba(10, 10, 15, 0.95)" : "#ffffff"
                    }}
                  >
                    <div className="grid grid-cols-1 gap-0.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setShowDropdown(false);
                          }}
                          className={`flex items-center px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors ${
                            category === cat 
                              ? "bg-purple-600/20 text-purple-400 font-bold border border-purple-500/10" 
                              : "text-zinc-300 hover:bg-white/5"
                          }`}
                          style={{
                            color: category === cat ? undefined : (isDark ? "#d4d4d8" : "#1e293b")
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section 3: Prompt Textarea Box */}
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            3. Operational Instruction Set
          </label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter prompt content and parameters..."
            rows={5}
            className={`w-full rounded-[20px] border ${theme.border} p-4 text-xs font-mono text-zinc-300 outline-none focus:border-purple-500/50 transition-all leading-relaxed resize-none`}
            style={{
              backgroundColor: isDark ? "rgba(10, 10, 16, 0.65)" : "#ffffff",
              color: isDark ? "#e4e4e7" : "#0f172a"
            }}
          />
        </div>

        {/* Section 4: Floating Large Premium Upload Button */}
        <div className="pt-6 flex justify-center">
          <motion.button
            type="button"
            onClick={handlePublishSubmit}
            disabled={isPublishing || (currentUser ? !isFormComplete : false)}
            whileHover={isFormComplete || !currentUser ? { scale: 1.05, y: -2 } : {}}
            whileTap={isFormComplete || !currentUser ? { scale: 0.95 } : {}}
            animate={isFormComplete && !isPublishing ? {
              boxShadow: [
                "0 0 16px rgba(168, 85, 247, 0.3)",
                "0 0 32px rgba(168, 85, 247, 0.6)",
                "0 0 16px rgba(168, 85, 247, 0.3)"
              ]
            } : {}}
            transition={{
              boxShadow: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            className={`relative flex h-16 w-full items-center justify-center overflow-hidden rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${
              isPublishing
                ? "bg-purple-650 cursor-wait text-white/50"
                : (isFormComplete || !currentUser)
                ? `${theme.accent} cursor-pointer`
                : "bg-zinc-800 border border-white/5 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {isPublishing ? (
              <div className="flex items-center space-y-0 space-x-2 animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Broadcasting Vector Pipeline...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-zinc-150 animate-pulse" />
                <span>{currentUser ? "Publish To Database" : "Secure Signature Required"}</span>
              </div>
            )}
          </motion.button>
        </div>

      </div>

    </div>
  );
}

import { useState, MouseEvent } from "react";
import { Copy, Check, Bookmark } from "lucide-react";
import { Prompt } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PromptCardProps {
  key?: any;
  prompt: Prompt;
  onSelect: (promptId: string) => void;
  isSavedByUser?: boolean;
  onSave?: any;
  onLike?: any;
  isLikedByUser?: any;
  userId?: any;
}

export default function PromptCard({
  prompt,
  onSelect,
  isSavedByUser = false,
  onSave,
  onLike,
  isLikedByUser = false,
  userId,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  // Organic modern Pinterest aspect variation
  const aspectClass = prompt.id.charCodeAt(prompt.id.length - 1) % 3 === 0 
    ? "aspect-[3/4]" 
    : prompt.id.charCodeAt(prompt.id.length - 1) % 3 === 1 
    ? "aspect-[1/1]" 
    : "aspect-[4/5]";

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      
      // Hit log copy endpoint gracefully
      fetch(`/api/prompts/${prompt.id}/copy`, { method: "POST" }).catch(err => {
        console.error("Copy logging fail:", err);
      });

      setCopied(true);
      setSparkle(true);
      
      window.dispatchEvent(new CustomEvent("promptverse-toast", {
        detail: { message: "⚡ Saved to clipboard!" }
      }));

      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setSparkle(false), 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      onSave(prompt.id, e);
    }
  };

  return (
    <motion.div
      onClick={() => onSelect(prompt.id)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-black/15 border border-white/5 shadow-lg active:scale-[0.98] transition-all duration-300 pb-3"
    >
      {/* 1. Large Pinterest Image Container */}
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-[20px] bg-zinc-950`}>
        <motion.img
          src={prompt.coverImage}
          alt={prompt.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover select-none"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Ambient Darkened Shimmer Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* 2. Visual Functional Action Bar underneath */}
      <div className="flex items-center justify-between mt-3 px-4">
        
        {/* Left Side: Save Icon (Heartbeat / Glow effects) */}
        <div className="relative">
          <motion.button
            onClick={handleSaveClick}
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            animate={isSavedByUser ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${
              isSavedByUser
                ? "bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-500/50 glow-active"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
            style={{
              boxShadow: isSavedByUser ? "0 0 16px rgba(168, 85, 247, 0.65)" : "none"
            }}
            title="Save Prompt"
          >
            <Bookmark className={`h-4.5 w-4.5 ${isSavedByUser ? "fill-current" : ""}`} />
          </motion.button>
        </div>

        {/* Right Side: Copy Icon (Success slide and custom sparkles) */}
        <div className="relative">
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${
              copied 
                ? "bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/50 glow-active"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
            style={{
              boxShadow: copied ? "0 0 16px rgba(16, 185, 129, 0.65)" : "none"
            }}
            title="Instant Clipboard Copy"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-4.5 w-4.5 stroke-[3px]" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy className="h-4.5 w-4.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Sparkles of pure delight */}
          {sparkle && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const dist = 20 + Math.random() * 8;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                );
              })}
            </div>
          )}

        </div>

      </div>
    </motion.div>
  );
}

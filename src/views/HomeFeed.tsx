import { useState, useEffect, MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import PromptMasonry from "../components/PromptMasonry";
import { Prompt, UserProfile } from "../types";
import { ThemeConfig } from "../theme";
import { motion, AnimatePresence } from "motion/react";

interface HomeFeedProps {
  prompts: Prompt[];
  onSelectPrompt: (promptId: string) => void;
  onLikePrompt: (promptId: string, e: MouseEvent) => void;
  onSavePrompt: (promptId: string, e: MouseEvent) => void;
  likedPromptIds: string[];
  savedPromptIds: string[];
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  theme: ThemeConfig;
}

export default function HomeFeed({
  prompts,
  onSelectPrompt,
  onLikePrompt,
  onSavePrompt,
  likedPromptIds,
  savedPromptIds,
  currentUser,
}: HomeFeedProps) {
  const [visibleCount, setVisibleCount] = useState(8);
  const [isAppending, setIsAppending] = useState(false);

  // Client-side viewport Infinite Scroll observer
  useEffect(() => {
    const handleScroll = () => {
      if (isAppending) return;
      
      const threshold = 180; // offset
      const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
      
      if (isNearBottom && visibleCount < prompts.length) {
        setIsAppending(true);
        // Add artificial delay for organic smooth loading feedback
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + 6, prompts.length));
          setIsAppending(false);
        }, 500);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prompts.length, visibleCount, isAppending]);

  const displayedPrompts = prompts.slice(0, visibleCount);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 pb-28 text-zinc-101 min-h-screen">
      {/* Visual Canvas Layout */}
      <motion.div 
        layout
        className="w-full"
      >
        <PromptMasonry
          prompts={displayedPrompts}
          onSelect={onSelectPrompt}
          onLike={onLikePrompt}
          onSave={onSavePrompt}
          likedPromptIds={likedPromptIds}
          savedPromptIds={savedPromptIds}
          userId={currentUser?.id}
        />
      </motion.div>

      {/* Infinite Scroll loading indicator */}
      <AnimatePresence>
        {(isAppending || visibleCount < prompts.length) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2.5"
          >
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550">
              SYNCHRONIZING FEED...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

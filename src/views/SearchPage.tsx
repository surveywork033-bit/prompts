import { useState, MouseEvent } from "react";
import { Search, ArrowLeft, ArrowUpRight } from "lucide-react";
import PromptMasonry from "../components/PromptMasonry";
import { Prompt, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ThemeConfig } from "../theme";

interface SearchPageProps {
  prompts: Prompt[];
  onSelectPrompt: (promptId: string) => void;
  onLikePrompt: (promptId: string, e: MouseEvent) => void;
  onSavePrompt: (promptId: string, e: MouseEvent) => void;
  likedPromptIds: string[];
  savedPromptIds: string[];
  currentUser: UserProfile | null;
  theme: ThemeConfig;
}

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  image: string;
}

export default function SearchPage({
  prompts,
  onSelectPrompt,
  onLikePrompt,
  onSavePrompt,
  likedPromptIds,
  savedPromptIds,
  currentUser,
  theme
}: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const isDark = theme.id !== "arctic";

  const categories: CategoryItem[] = [
    { id: "trending", name: "Trending", emoji: "🔥", gradient: "from-orange-500/30 to-red-600/40", image: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=500&q=80" },
    { id: "new", name: "New", emoji: "✨", gradient: "from-blue-500/30 to-indigo-600/40", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80" },
    { id: "chatgpt", name: "ChatGPT", emoji: "🤖", gradient: "from-emerald-500/30 to-teal-600/40", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80" },
    { id: "gemini", name: "Gemini", emoji: "💎", gradient: "from-cyan-500/30 to-blue-600/40", image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&q=80" },
    { id: "midjourney", name: "Midjourney", emoji: "🎨", gradient: "from-purple-500/30 to-pink-600/40", image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80" },
    { id: "coding", name: "Coding", emoji: "💻", gradient: "from-slate-700/30 to-slate-900/40", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80" },
    { id: "business", name: "Business", emoji: "🚀", gradient: "from-amber-600/30 to-orange-600/40", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80" },
    { id: "marketing", name: "Marketing", emoji: "📈", gradient: "from-rose-500/30 to-pink-600/40", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80" },
    { id: "education", name: "Education", emoji: "📚", gradient: "from-yellow-500/30 to-orange-500/40", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80" },
    { id: "gaming", name: "Gaming", emoji: "🎮", gradient: "from-fuchsia-500/30 to-purple-600/40", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&q=80" },
    { id: "productivity", name: "Productivity", emoji: "🧠", gradient: "from-emerald-600/30 to-sky-600/40", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80" },
    { id: "content", name: "Content Creation", emoji: "🎬", gradient: "from-indigo-500/30 to-purple-800/40", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80" }
  ];

  // Precision filtering matching of our backend categorizations or user searches
  const getFilteredItems = () => {
    return prompts.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesQuery = 
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      if (selectedCategory) {
        const catObj = categories.find(c => c.id === selectedCategory);
        if (catObj) {
          if (selectedCategory === "trending") {
            return (p.copiesCount && p.copiesCount > 0) || p.likesCount > 2 || p.viewsCount > 15;
          }
          if (selectedCategory === "new") {
            return true; // Simple chronological pass-through sorted later
          }
          
          const mappedName = catObj.name.toLowerCase();
          const matchesCategory = 
            p.category.toLowerCase() === mappedName ||
            p.category.toLowerCase().replace(/\s+/g, '') === mappedName.replace(/\s+/g, '') ||
            p.tags.some(t => t.toLowerCase() === mappedName);
          return matchesCategory;
        }
      }

      return true;
    }).sort((a, b) => {
      if (selectedCategory === "trending") {
        return (b.copiesCount || 0) * 4 + (b.likesCount || 0) * 2 - ((a.copiesCount || 0) * 4 + (a.likesCount || 0) * 2);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const results = getFilteredItems();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32 text-zinc-100 min-h-screen">
      
      {/* Search Input Box */}
      <div className="max-w-xl mx-auto mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center"
        >
          <Search className={`absolute left-5 h-5 w-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompt templates, keyword models..."
            className={`w-full rounded-[24px] border ${theme.border} py-4.5 pl-14 pr-12 text-sm placeholder-zinc-500 outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/5 shadow-xl transition-all duration-300`}
            style={{
              backgroundColor: isDark ? "rgba(10, 10, 14, 0.7)" : "#ffffff",
              color: isDark ? "#eaeaea" : "#0f172a"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-black transition cursor-pointer"
            >
              ×
            </button>
          )}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory && !searchQuery ? (
          /* Visual Categories Pinboard */
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-left py-2 border-b border-white/5">
              <h2 className={`text-base font-black tracking-tight ${theme.textPrimary}`}>
                Browse Vector Spaces
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative h-32 cursor-pointer overflow-hidden rounded-[24px] border border-white/5 bg-zinc-950 shadow-md transition-all duration-300"
                >
                  {/* Category Card Cover Image */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover select-none transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Saturated visual filter */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} mix-blend-multiply opacity-40 group-hover:opacity-55 transition-opacity duration-300`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Frosted glass title bar overlay */}
                  <div className="absolute inset-x-3 bottom-3 p-2 rounded-[16px] bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-between text-left transition-all group-hover:bg-black/60">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-sm select-none">{cat.emoji}</span>
                      <span className="text-[11px] font-black tracking-wider uppercase text-white truncate">
                        {cat.name}
                      </span>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Filtered Results Masonry Layout */
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-left"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className={`flex items-center space-x-2 text-xs font-black uppercase tracking-wider cursor-pointer ${theme.accentText} hover:opacity-85`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Show All Collections</span>
              </button>

              <span className="text-xs font-mono text-zinc-500">
                Found {results.length} vectors
              </span>
            </div>

            <PromptMasonry
              prompts={results}
              onSelect={onSelectPrompt}
              onLike={onLikePrompt}
              onSave={onSavePrompt}
              likedPromptIds={likedPromptIds}
              savedPromptIds={savedPromptIds}
              userId={currentUser?.id}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

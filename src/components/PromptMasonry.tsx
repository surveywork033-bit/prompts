import { useMemo, MouseEvent } from "react";
import PromptCard from "./PromptCard";
import { Prompt } from "../types";

interface PromptMasonryProps {
  prompts: Prompt[];
  onSelect: (promptId: string) => void;
  onLike: (promptId: string, e: MouseEvent) => void;
  onSave: (promptId: string, e: MouseEvent) => void;
  likedPromptIds: string[];
  savedPromptIds: string[];
  userId: string | undefined;
}

export default function PromptMasonry({
  prompts,
  onSelect,
  onLike,
  onSave,
  likedPromptIds,
  savedPromptIds,
  userId
}: PromptMasonryProps) {
  // Pure flex distribution columns for Pinterest feel
  const columns = useMemo(() => {
    const col1: Prompt[] = [];
    const col2: Prompt[] = [];
    const col3: Prompt[] = [];

    prompts.forEach((prompt, idx) => {
      if (idx % 3 === 0) {
        col1.push(prompt);
      } else if (idx % 3 === 1) {
        col2.push(prompt);
      } else {
        col3.push(prompt);
      }
    });

    return [col1, col2, col3];
  }, [prompts]);

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-md">
        <span className="text-sm font-semibold text-zinc-400">No prompts found matching the filters.</span>
        <span className="text-xs text-zinc-650 mt-1">Try broadening your search query or uploading a new prompt template.</span>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Feed: 1 Column */}
      <div className="block sm:hidden space-y-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelect}
            onLike={onLike}
            onSave={onSave}
            isLikedByUser={likedPromptIds.includes(prompt.id)}
            isSavedByUser={savedPromptIds.includes(prompt.id)}
            userId={userId}
          />
        ))}
      </div>

      {/* Tablet Feed: 2 Columns */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
        <div className="space-y-4">
          {prompts.filter((_, i) => i % 2 === 0).map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSelect={onSelect}
              onLike={onLike}
              onSave={onSave}
              isLikedByUser={likedPromptIds.includes(prompt.id)}
              isSavedByUser={savedPromptIds.includes(prompt.id)}
              userId={userId}
            />
          ))}
        </div>
        <div className="space-y-4">
          {prompts.filter((_, i) => i % 2 === 1).map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSelect={onSelect}
              onLike={onLike}
              onSave={onSave}
              isLikedByUser={likedPromptIds.includes(prompt.id)}
              isSavedByUser={savedPromptIds.includes(prompt.id)}
              userId={userId}
            />
          ))}
        </div>
      </div>

      {/* Desktop/Wide Feed: 3 Columns Masonry */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {columns.map((colPrompts, colIdx) => (
          <div key={colIdx} className="space-y-6">
            {colPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSelect={onSelect}
                onLike={onLike}
                onSave={onSave}
                isLikedByUser={likedPromptIds.includes(prompt.id)}
                isSavedByUser={savedPromptIds.includes(prompt.id)}
                userId={userId}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

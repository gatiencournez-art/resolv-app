'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = disabled || isSending;
  const canSend = content.trim().length > 0 && !isDisabled;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-end gap-2 rounded-2xl border border-th-border/50 dark:border-white/[0.08] bg-surface-secondary/50 dark:bg-white/[0.02] focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message... (Entrée pour envoyer)"
          disabled={isDisabled}
          rows={1}
          className="flex-1 px-4 py-3 text-[13px] bg-transparent text-foreground placeholder:text-foreground-muted/50 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`
            flex-shrink-0 w-9 h-9 mr-1.5 mb-1.5 rounded-xl flex items-center justify-center transition-all duration-200
            ${canSend
              ? 'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-md active:scale-95'
              : 'bg-foreground-muted/10 text-foreground-muted/30 cursor-not-allowed'
            }
          `}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-foreground-muted/40 mt-1.5 ml-1">
        Appuyez sur <kbd className="px-1 py-0.5 rounded bg-surface-tertiary/60 text-foreground-muted/60 font-mono text-[9px]">Entrée</kbd> pour envoyer, <kbd className="px-1 py-0.5 rounded bg-surface-tertiary/60 text-foreground-muted/60 font-mono text-[9px]">Shift+Entrée</kbd> pour une nouvelle ligne
      </p>
    </form>
  );
}

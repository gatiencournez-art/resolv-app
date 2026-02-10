'use client';

import { Message } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

interface MessagesListProps {
  messages: Message[];
  isLoading?: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffD = Math.floor((now.getTime() - d.getTime()) / 86400000);

  // Same day: show time
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hier, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // This week
  if (diffD < 7) {
    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return `${dayName}, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Older
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessagesList({ messages, isLoading }: MessagesListProps) {
  const { user, isAdminView } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        </div>
        <p className="text-xs text-foreground-muted mt-3">Chargement des messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-accent/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground-secondary">Aucun message</p>
        <p className="text-xs text-foreground-muted mt-1">Démarrez la conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const isOwn = message.authorUserId === user?.id;
        const authorName = message.authorName || (message.author ? `${message.author.firstName} ${message.author.lastName}` : 'Utilisateur');
        const initials = authorName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        // Check if we should show the avatar (first message or different author)
        const prevMessage = messages[index - 1];
        const showAvatar = !prevMessage || prevMessage.authorUserId !== message.authorUserId;
        const isLastInGroup = !messages[index + 1] || messages[index + 1].authorUserId !== message.authorUserId;

        return (
          <div
            key={message.id}
            className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar spacer or avatar */}
            <div className="flex-shrink-0 w-8">
              {showAvatar && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shadow-sm ${
                    isOwn
                      ? 'bg-accent text-white'
                      : 'bg-surface-tertiary dark:bg-white/[0.08] text-foreground-secondary border border-white/[0.06]'
                  }`}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Message bubble */}
            <div className={`max-w-[85%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
              {/* Author name (only on first message of group) */}
              {showAvatar && (
                <div className={`flex items-center gap-1.5 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-medium text-foreground-secondary">
                    {isOwn ? 'Vous' : authorName}
                  </span>
                  {!isOwn && message.author?.role && (
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      message.author.role === 'ADMIN'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-surface-tertiary text-foreground-muted'
                    }`}>
                      {isAdminView
                        ? (message.author.role === 'ADMIN' ? 'Admin' : 'Demandeur')
                        : (message.author.role === 'ADMIN' ? 'Admin' : '')
                      }
                    </span>
                  )}
                </div>
              )}

              {/* Bubble */}
              <div
                className={`
                  relative inline-block px-3.5 py-2 text-[13px] leading-relaxed
                  ${isOwn
                    ? `bg-accent text-white ${showAvatar ? 'rounded-2xl rounded-tr-md' : isLastInGroup ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-r-md'}`
                    : `bg-surface-secondary dark:bg-white/[0.04] text-foreground border border-th-border/30 dark:border-white/[0.06] ${showAvatar ? 'rounded-2xl rounded-tl-md' : isLastInGroup ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-l-md'}`
                  }
                `}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>

              {/* Time (only on last message of group) */}
              {isLastInGroup && (
                <span className={`text-[10px] text-foreground-muted/60 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                  {formatTime(message.createdAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

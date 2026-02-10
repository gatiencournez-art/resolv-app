'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, type Notification } from '@/contexts/notification-context';
import { useLanguage } from '@/contexts/language-context';

// ============================================================================
// ICONS
// ============================================================================

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) {
  const { language } = useLanguage();

  const getIcon = () => {
    switch (notification.type) {
      case 'ticket_created':
      case 'ticket_status_changed':
      case 'ticket_assigned':
        return <TicketIcon />;
      case 'new_message':
        return <MessageIcon />;
      case 'user_pending':
        return <UserIcon />;
      default:
        return <BellIcon />;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'ticket_created':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'ticket_status_changed':
        return 'bg-blue-500/15 text-blue-400';
      case 'new_message':
        return 'bg-violet-500/15 text-violet-400';
      case 'ticket_assigned':
        return 'bg-amber-500/15 text-amber-400';
      case 'user_pending':
        return 'bg-orange-500/15 text-orange-400';
      default:
        return 'bg-gray-500/15 text-gray-400';
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (language === 'en') {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } else {
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins}m`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      return `Il y a ${diffDays}j`;
    }
  };

  const content = (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer
        ${!notification.read ? 'bg-accent/[0.03]' : ''}
      `}
      onClick={onMarkAsRead}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${getTypeColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.read ? 'text-foreground-secondary' : 'text-foreground font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-foreground-muted truncate mt-0.5">{notification.message}</p>
        <p className="text-[10px] text-foreground-muted/70 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
      )}
    </div>
  );

  if (notification.ticketId) {
    return (
      <Link href={`/tickets/${notification.ticketId}`}>
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-xl transition-colors
          ${isOpen
            ? 'bg-accent/10 text-accent'
            : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.04] dark:hover:bg-white/[0.04]'
          }
        `}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-accent text-white rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-th-border/60 dark:border-white/[0.08] rounded-2xl shadow-lg overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-th-border/40 dark:border-white/[0.06]">
            <h3 className="text-sm font-semibold text-foreground">
              {language === 'en' ? 'Notifications' : 'Notifications'}
            </h3>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] dark:hover:bg-white/[0.06] transition-colors text-foreground-muted hover:text-foreground"
                  title={language === 'en' ? 'Mark all as read' : 'Tout marquer comme lu'}
                >
                  <CheckAllIcon />
                </button>
              </div>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] dark:bg-white/[0.04] flex items-center justify-center text-foreground-muted">
                  <BellIcon />
                </div>
                <p className="text-sm text-foreground-muted">
                  {language === 'en' ? 'No notifications' : 'Aucune notification'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-th-border/30 dark:divide-white/[0.04]">
                {notifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-th-border/40 dark:border-white/[0.06] bg-surface-secondary/30 dark:bg-white/[0.02]">
              <button
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {language === 'en' ? 'Clear all' : 'Tout effacer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

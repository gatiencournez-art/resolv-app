'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'ticket_status_changed'
  | 'ticket_assigned'
  | 'new_message'
  | 'user_pending'
  | 'ticket_created';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  ticketKey?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ============================================================================
// HELPER - Generate ID
// ============================================================================

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAdminView } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('resolv-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Notification[];
        // Only keep notifications from the last 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = parsed.filter(n => new Date(n.createdAt).getTime() > sevenDaysAgo);
        setNotifications(recent);
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('resolv-notifications', JSON.stringify(notifications));
  }, [notifications, mounted]);

  // Poll for new tickets/messages (simplified - in real app, use WebSocket or SSE)
  useEffect(() => {
    if (!mounted || !user) return;

    let previousTicketIds: Set<string> = new Set();
    let previousMessageCounts: Map<string, number> = new Map();

    const checkForUpdates = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const res = await api.getTickets(token, { limit: '50' }) as { data: Array<{
          id: string;
          key: string;
          title: string;
          status: string;
          assignedAdminId: string | null;
          createdByUserId: string | null;
          messages?: Array<{ id: string }>;
        }> };

        const tickets = res.data || [];
        const currentTicketIds = new Set(tickets.map(t => t.id));

        // Check for new tickets (for admins)
        if (isAdminView && previousTicketIds.size > 0) {
          for (const ticket of tickets) {
            if (!previousTicketIds.has(ticket.id)) {
              addNotification({
                type: 'ticket_created',
                title: 'Nouveau ticket',
                message: `${ticket.key}: ${ticket.title}`,
                ticketId: ticket.id,
                ticketKey: ticket.key,
              });
            }
          }
        }

        // Check for new messages on user's tickets
        for (const ticket of tickets) {
          const isMyTicket = isAdminView
            ? ticket.assignedAdminId === user.id
            : ticket.createdByUserId === user.id;

          if (isMyTicket && ticket.messages) {
            const currentCount = ticket.messages.length;
            const previousCount = previousMessageCounts.get(ticket.id) || 0;

            if (previousCount > 0 && currentCount > previousCount) {
              addNotification({
                type: 'new_message',
                title: 'Nouveau message',
                message: `Nouveau message sur ${ticket.key}`,
                ticketId: ticket.id,
                ticketKey: ticket.key,
              });
            }
            previousMessageCounts.set(ticket.id, currentCount);
          }
        }

        previousTicketIds = currentTicketIds;
      } catch { /* ignore */ }
    };

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkForUpdates, 2000);

    // Then check every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [mounted, user, isAdminView]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

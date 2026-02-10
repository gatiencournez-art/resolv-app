'use client';

import { useEffect, useCallback } from 'react';
import { useTicketWorkspace } from '@/contexts/ticket-workspace-context';
import { TicketDetailContent } from './ticket-detail-panel';

export function TicketDetailDrawer({ className = '' }: { className?: string }) {
  const { selectedTicketId, selectTicket } = useTicketWorkspace();

  const handleClose = useCallback(() => selectTicket(null), [selectTicket]);

  // Lock body scroll when open
  useEffect(() => {
    if (selectedTicketId) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedTicketId]);

  // Close on Escape
  useEffect(() => {
    if (!selectedTicketId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selectedTicketId, handleClose]);

  if (!selectedTicketId) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-surface rounded-l-2xl border-l border-th-border/60 dark:border-white/[0.06] shadow-elevated overflow-hidden animate-slide-in-right">
        <TicketDetailContent onClose={handleClose} />
      </div>
    </div>
  );
}

'use client';

import type { Ticket } from '@/lib/types';
import { TicketStatusBadge } from '@/components/tickets';

// ============================================================================
// HELPERS
// ============================================================================

const PRIORITY_COLORS: Record<string, { dot: string; ring: string }> = {
  LOW: { dot: 'bg-[var(--priority-low)]', ring: 'ring-[var(--priority-low)]/20' },
  MEDIUM: { dot: 'bg-[var(--priority-medium)]', ring: 'ring-[var(--priority-medium)]/20' },
  HIGH: { dot: 'bg-[var(--priority-high)]', ring: 'ring-[var(--priority-high)]/20' },
  CRITICAL: { dot: 'bg-[var(--priority-critical)]', ring: 'ring-[var(--priority-critical)]/20' },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

function relativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ============================================================================
// COMPONENT
// ============================================================================

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
  showAssignee: boolean;
}

export function TicketListItem({ ticket, isSelected, onClick, showAssignee }: TicketListItemProps) {
  const assigneeInitials = ticket.assignedAdmin
    ? `${ticket.assignedAdmin.firstName[0]}${ticket.assignedAdmin.lastName[0]}`
    : null;

  const priority = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.MEDIUM;
  const isUrgent = ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group w-full text-left px-4 py-3.5 transition-all duration-[150ms] border-l-[3px]
        ${isSelected
          ? 'bg-accent/[0.07] border-l-accent'
          : 'border-l-transparent hover:bg-surface-hover dark:hover:bg-white/[0.03]'
        }
      `}
    >
      {/* Row 1: Title + Date */}
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-[13px] font-semibold leading-snug line-clamp-1 ${
            isSelected ? 'text-accent' : 'text-foreground group-hover:text-foreground'
          }`}
        >
          {ticket.title}
        </p>
        <span className="text-[10px] text-foreground-muted whitespace-nowrap flex-shrink-0 mt-0.5 tabular-nums">
          {relativeDate(ticket.createdAt)}
        </span>
      </div>

      {/* Row 2: Key + Priority pill + Status badge + Assignee */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-mono text-foreground-muted/80 tracking-tight">{ticket.key}</span>

        <span className="text-foreground-muted/30 text-[10px]">&middot;</span>

        {/* Priority indicator */}
        <span className="inline-flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} ${isUrgent ? 'ring-2 ' + priority.ring : ''}`} />
          <span className={`text-[10px] font-medium ${isUrgent ? 'text-[var(--priority-' + ticket.priority.toLowerCase() + ')]' : 'text-foreground-muted'}`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
        </span>

        <span className="text-foreground-muted/30 text-[10px]">&middot;</span>

        <TicketStatusBadge status={ticket.status} size="sm" />

        {/* Assignee avatar (pushed right) */}
        {showAssignee && (
          <span className="ml-auto flex-shrink-0">
            {assigneeInitials ? (
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold
                ${isSelected ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent/80'}
              `}>
                {assigneeInitials}
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-foreground-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            )}
          </span>
        )}
      </div>

      {/* Row 3: Description preview */}
      {ticket.description && (
        <p className="text-[11px] text-foreground-muted/50 mt-1.5 line-clamp-1 leading-relaxed">
          {ticket.description}
        </p>
      )}
    </button>
  );
}

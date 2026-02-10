import { TicketStatus } from '@/lib/types';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; dot: string }> = {
  NEW: { label: 'Nouveau', color: 'text-[var(--status-new)]', bg: 'bg-[var(--status-new-bg)]', dot: 'bg-[var(--status-new)]' },
  IN_PROGRESS: { label: 'En cours', color: 'text-[var(--status-progress)]', bg: 'bg-[var(--status-progress-bg)]', dot: 'bg-[var(--status-progress)]' },
  ON_HOLD: { label: 'En attente', color: 'text-[var(--status-hold)]', bg: 'bg-[var(--status-hold-bg)]', dot: 'bg-[var(--status-hold)]' },
  RESOLVED: { label: 'Résolu', color: 'text-[var(--status-resolved)]', bg: 'bg-[var(--status-resolved-bg)]', dot: 'bg-[var(--status-resolved)]' },
  CLOSED: { label: 'Fermé', color: 'text-[var(--status-closed)]', bg: 'bg-[var(--status-closed-bg)]', dot: 'bg-[var(--status-closed)]' },
};

export function TicketStatusBadge({ status, size = 'md' }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.NEW;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1.5' : 'px-2.5 py-1 text-xs gap-1.5';
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span className={`inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses} ${config.bg} ${config.color}`}>
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: TicketStatus): string {
  return statusConfig[status]?.label || status;
}

import { UserStatus } from '@/lib/types';

interface UserStatusBadgeProps {
  status: UserStatus;
}

const statusConfig: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  PENDING: {
    label: 'En attente',
    color: 'text-[var(--status-progress)]',
    bg: 'bg-[var(--status-progress-bg)]',
    dot: 'bg-[var(--status-progress)]',
  },
  ACTIVE: {
    label: 'Actif',
    color: 'text-[var(--status-resolved)]',
    bg: 'bg-[var(--status-resolved-bg)]',
    dot: 'bg-[var(--status-resolved)]',
  },
  SUSPENDED: {
    label: 'Suspendu',
    color: 'text-[var(--priority-critical)]',
    bg: 'bg-surface-tertiary',
    dot: 'bg-[var(--priority-critical)]',
  },
  REJECTED: {
    label: 'Refusé',
    color: 'text-[var(--priority-high)]',
    bg: 'bg-[var(--priority-high)]/10',
    dot: 'bg-[var(--priority-high)]',
  },
  DELETED: {
    label: 'Supprimé',
    color: 'text-foreground-muted',
    bg: 'bg-surface-tertiary',
    dot: 'bg-foreground-muted',
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${config.bg} ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

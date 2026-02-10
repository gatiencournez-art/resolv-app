import { TicketPriority } from '@/lib/types';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; dot: string }> = {
  LOW: { label: 'Basse', color: 'text-[var(--priority-low)]', bg: 'bg-[var(--priority-low)]/10', dot: 'bg-[var(--priority-low)]' },
  MEDIUM: { label: 'Moyenne', color: 'text-[var(--priority-medium)]', bg: 'bg-[var(--priority-medium)]/10', dot: 'bg-[var(--priority-medium)]' },
  HIGH: { label: 'Haute', color: 'text-[var(--priority-high)]', bg: 'bg-[var(--priority-high)]/10', dot: 'bg-[var(--priority-high)]' },
  CRITICAL: { label: 'Critique', color: 'text-[var(--priority-critical)]', bg: 'bg-[var(--priority-critical)]/10', dot: 'bg-[var(--priority-critical)]' },
};

export function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1.5' : 'px-2.5 py-1 text-xs gap-1.5';
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span className={`inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses} ${config.bg} ${config.color}`}>
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function getPriorityLabel(priority: TicketPriority): string {
  return priorityConfig[priority]?.label || priority;
}

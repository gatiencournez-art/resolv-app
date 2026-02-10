import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-tertiary text-foreground-secondary',
      primary: 'bg-accent-muted text-accent',
      success: 'bg-[var(--status-resolved-bg)] text-[var(--status-resolved)]',
      warning: 'bg-[var(--status-progress-bg)] text-[var(--status-progress)]',
      danger: 'bg-[color-mix(in_srgb,var(--priority-critical)_15%,transparent)] text-[var(--priority-critical)]',
      info: 'bg-[var(--status-new-bg)] text-[var(--status-new)]',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Helpers pour les statuts
export const getTicketStatusBadge = (status: string) => {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    NEW: { variant: 'info', label: 'Nouveau' },
    IN_PROGRESS: { variant: 'primary', label: 'En cours' },
    ON_HOLD: { variant: 'warning', label: 'En attente' },
    RESOLVED: { variant: 'success', label: 'Résolu' },
    CLOSED: { variant: 'default', label: 'Fermé' },
  };
  return map[status] || { variant: 'default', label: status };
};

export const getTicketPriorityBadge = (priority: string) => {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    LOW: { variant: 'default', label: 'Basse' },
    MEDIUM: { variant: 'info', label: 'Moyenne' },
    HIGH: { variant: 'warning', label: 'Haute' },
    CRITICAL: { variant: 'danger', label: 'Critique' },
  };
  return map[priority] || { variant: 'default', label: priority };
};

export const getUserStatusBadge = (status: string) => {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    PENDING: { variant: 'warning', label: 'En attente' },
    ACTIVE: { variant: 'success', label: 'Actif' },
    SUSPENDED: { variant: 'danger', label: 'Suspendu' },
    DELETED: { variant: 'default', label: 'Supprimé' },
  };
  return map[status] || { variant: 'default', label: status };
};

export { Badge };

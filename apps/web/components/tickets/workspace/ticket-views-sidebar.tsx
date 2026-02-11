'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useTicketWorkspace, type TicketView } from '@/contexts/ticket-workspace-context';

// ============================================================================
// ICONS (16px, strokeWidth 1.5)
// ============================================================================

function InboxIcon() {
  return (
    <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function UserTicketsIcon() {
  return (
    <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UnassignedIcon() {
  return (
    <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  );
}

function ClockAlertIcon() {
  return (
    <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// ============================================================================
// STATUS DOTS
// ============================================================================

function StatusDot({ color }: { color: string }) {
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

// ============================================================================
// VIEW DEFINITIONS
// ============================================================================

interface ViewItem {
  key: TicketView;
  label: string;
  icon: React.ReactNode;
  section: 'smart' | 'status';
  adminOnly?: boolean;
  accentColor?: string;
}

const VIEW_ITEMS: ViewItem[] = [
  { key: 'my_tickets', label: 'Mes tickets', icon: <UserTicketsIcon />, section: 'smart' },
  { key: 'unassigned', label: 'Non assignés', icon: <UnassignedIcon />, section: 'smart', adminOnly: true },
  { key: 'high_priority', label: 'Haute priorité', icon: <FireIcon />, section: 'smart', accentColor: 'text-amber-400' },
  { key: 'overdue', label: 'En retard (SLA)', icon: <ClockAlertIcon />, section: 'smart', accentColor: 'text-rose-400' },
  { key: 'all', label: 'Tous les tickets', icon: <InboxIcon />, section: 'status' },
  { key: 'new', label: 'Nouveaux', icon: <StatusDot color="bg-[var(--status-new)]" />, section: 'status' },
  { key: 'in_progress', label: 'En cours', icon: <StatusDot color="bg-[var(--status-progress)]" />, section: 'status' },
  { key: 'resolved', label: 'Résolus', icon: <StatusDot color="bg-[var(--status-resolved)]" />, section: 'status' },
];

// ============================================================================
// VIEW BUTTON
// ============================================================================

function ViewButton({
  view,
  isActive,
  count,
  onClick,
}: {
  view: ViewItem;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  const showDangerBadge = (view.key === 'high_priority' || view.key === 'overdue') && count > 0 && !isActive;

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2.5 w-full px-3 py-[9px] rounded-xl text-[13px] font-medium
        transition-all duration-150 relative
        ${isActive
          ? 'bg-surface-hover text-foreground shadow-[inset_0_0_0_1px] shadow-th-border/50'
          : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
        }
      `}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
      )}
      <span
        className={`flex-shrink-0 flex items-center justify-center w-4 h-4 ${
          isActive
            ? 'text-accent'
            : view.accentColor && count > 0
              ? view.accentColor
              : 'text-foreground-muted group-hover:text-foreground-secondary'
        }`}
      >
        {view.icon}
      </span>
      <span className="flex-1 text-left truncate">{view.label}</span>
      {count > 0 && (
        <span
          className={`text-[10px] font-semibold tabular-nums px-1.5 py-px rounded-md min-w-[20px] text-center ${
            isActive
              ? 'bg-accent/20 text-accent'
              : showDangerBadge
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-surface-tertiary text-foreground-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TicketViewsSidebar({ className = '' }: { className?: string }) {
  const { isAdminView } = useAuth();
  const { activeView, setActiveView, viewCounts } = useTicketWorkspace();

  const visibleViews = VIEW_ITEMS.filter((v) => !v.adminOnly || isAdminView);
  const smartViews = visibleViews.filter((v) => v.section === 'smart');
  const statusViews = visibleViews.filter((v) => v.section === 'status');

  return (
    <div
      className={`w-[220px] flex-shrink-0 flex flex-col bg-surface border-r border-th-border overflow-y-auto ${className}`}
    >
      {/* New ticket CTA */}
      <div className="px-3 pt-5 pb-2">
        <Link
          href="/tickets/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] active:scale-[0.97]"
        >
          <PlusIcon />
          Nouveau ticket
        </Link>
      </div>

      {/* Smart views */}
      <div className="px-3 pt-5 pb-2">
        <p className="px-3 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.14em]">
          Vues intelligentes
        </p>
      </div>
      <nav className="px-2 space-y-px">
        {smartViews.map((view) => (
          <ViewButton
            key={view.key}
            view={view}
            isActive={activeView === view.key}
            count={viewCounts[view.key]}
            onClick={() => setActiveView(view.key)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-4 h-px bg-th-border" />

      {/* Status views */}
      <div className="px-3 pb-2">
        <p className="px-3 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.14em]">
          Par statut
        </p>
      </div>
      <nav className="px-2 space-y-px pb-6">
        {statusViews.map((view) => (
          <ViewButton
            key={view.key}
            view={view}
            isActive={activeView === view.key}
            count={viewCounts[view.key]}
            onClick={() => setActiveView(view.key)}
          />
        ))}
      </nav>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useTicketWorkspace, type TicketView } from '@/contexts/ticket-workspace-context';
import { Select, MultiSelect } from '@/components/ui';
import type { SelectOption, MultiSelectOption } from '@/components/ui';
import type { Ticket, TicketStatus, TicketPriority } from '@/lib/types';
import { TicketStatusBadge } from '@/components/tickets';
import { TicketPriorityBadge } from '@/components/tickets';

// ============================================================================
// VIEW OPTIONS (for mobile dropdown)
// ============================================================================

const adminViewOptions: SelectOption[] = [
  { value: 'all', label: 'Tous les tickets' },
  { value: 'my_tickets', label: 'Mes tickets' },
  { value: 'unassigned', label: 'Non assignés' },
  { value: 'high_priority', label: 'Haute priorité' },
  { value: 'overdue', label: 'En retard' },
  { value: 'new', label: 'Nouveaux' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
];

const userViewOptions: SelectOption[] = [
  { value: 'all', label: 'Tous les tickets' },
  { value: 'my_tickets', label: 'Mes tickets' },
  { value: 'new', label: 'Nouveaux' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
];

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const statusOptions: MultiSelectOption[] = [
  { value: 'NEW', label: 'Nouveau', dot: 'bg-[var(--status-new)]' },
  { value: 'IN_PROGRESS', label: 'En cours', dot: 'bg-[var(--status-progress)]' },
  { value: 'ON_HOLD', label: 'En attente', dot: 'bg-[var(--status-hold)]' },
  { value: 'RESOLVED', label: 'Résolu', dot: 'bg-[var(--status-resolved)]' },
  { value: 'CLOSED', label: 'Fermé', dot: 'bg-[var(--status-closed)]' },
];

const priorityOptions: MultiSelectOption[] = [
  { value: 'LOW', label: 'Basse', dot: 'bg-[var(--priority-low)]' },
  { value: 'MEDIUM', label: 'Moyenne', dot: 'bg-[var(--priority-medium)]' },
  { value: 'HIGH', label: 'Haute', dot: 'bg-[var(--priority-high)]' },
  { value: 'CRITICAL', label: 'Critique', dot: 'bg-[var(--priority-critical)]' },
];

const typeOptions: MultiSelectOption[] = [
  { value: 'SOFTWARE', label: 'Logiciel' },
  { value: 'HARDWARE', label: 'Matériel' },
  { value: 'ACCESS', label: 'Accès' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'OFFBOARDING', label: 'Offboarding' },
  { value: 'OTHER', label: 'Autre' },
];

// ============================================================================
// SORT
// ============================================================================

type SortField = 'createdAt' | 'status' | 'priority' | 'title' | 'requester' | 'assignee';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER: Record<string, number> = { NEW: 0, IN_PROGRESS: 1, ON_HOLD: 2, RESOLVED: 3, CLOSED: 4 };

function sortTickets(tickets: Ticket[], field: SortField, dir: SortDir): Ticket[] {
  const mult = dir === 'asc' ? 1 : -1;
  return [...tickets].sort((a, b) => {
    switch (field) {
      case 'createdAt':
        return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'status':
        return mult * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
      case 'priority':
        return mult * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
      case 'title':
        return mult * a.title.localeCompare(b.title, 'fr');
      case 'requester':
        return mult * `${a.requesterFirstName} ${a.requesterLastName}`.localeCompare(
          `${b.requesterFirstName} ${b.requesterLastName}`, 'fr'
        );
      case 'assignee': {
        const aName = a.assignedAdmin ? `${a.assignedAdmin.firstName} ${a.assignedAdmin.lastName}` : 'zzz';
        const bName = b.assignedAdmin ? `${b.assignedAdmin.firstName} ${b.assignedAdmin.lastName}` : 'zzz';
        return mult * aName.localeCompare(bName, 'fr');
      }
      default:
        return 0;
    }
  });
}

// ============================================================================
// HELPERS
// ============================================================================

const TYPE_LABELS: Record<string, string> = {
  SOFTWARE: 'Logiciel',
  HARDWARE: 'Matériel',
  ACCESS: 'Accès',
  ONBOARDING: 'Onboarding',
  OFFBOARDING: 'Offboarding',
  OTHER: 'Autre',
};

const TYPE_ICONS: Record<string, string> = {
  SOFTWARE: '💻',
  HARDWARE: '🖥️',
  ACCESS: '🔑',
  ONBOARDING: '👋',
  OFFBOARDING: '🚪',
  OTHER: '📋',
};

function relativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: diffD > 365 ? 'numeric' : undefined });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// ICONS
// ============================================================================

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}


// ============================================================================
// TABLE HEADER CELL
// ============================================================================

function ThCell({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className = '',
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;
  return (
    <th className={`text-left ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`
          text-[11px] font-semibold uppercase tracking-wider
          transition-colors hover:text-foreground
          ${isActive ? 'text-accent' : 'text-foreground-muted/70'}
        `}
      >
        {label}
      </button>
    </th>
  );
}

// ============================================================================
// SLA INDICATOR
// ============================================================================

function SlaIndicator({ ticket }: { ticket: Ticket }) {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    if (ticket.slaBreachedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Dépassé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Respecté
      </span>
    );
  }

  if (ticket.slaBreachedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        En retard
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted/60">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
      OK
    </span>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TicketListPanel() {
  const { isAdminView } = useAuth();
  const {
    filteredTickets,
    admins,
    selectedTicketId,
    selectTicket,
    activeView,
    setActiveView,
    search,
    setSearch,
    filters,
    setFilters,
    isLoadingList,
  } = useTicketWorkspace();

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const sortedTickets = useMemo(
    () => sortTickets(filteredTickets, sortField, sortDir),
    [filteredTickets, sortField, sortDir]
  );

  const assigneeOptions = useMemo<MultiSelectOption[]>(() => {
    const opts: MultiSelectOption[] = [
      { value: '__unassigned__', label: 'Non assigné' },
    ];
    admins.forEach((a) => {
      opts.push({
        value: a.id,
        label: `${a.firstName} ${a.lastName}`,
        avatar: `${a.firstName[0]}${a.lastName[0]}`,
      });
    });
    return opts;
  }, [admins]);

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.types.length > 0 ||
    filters.assignees.length > 0;

  const activeFilterCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.priorities.length > 0 ? 1 : 0) +
    (filters.types.length > 0 ? 1 : 0) +
    (filters.assignees.length > 0 ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-th-border/60 dark:border-white/[0.06] bg-surface">
      {/* Header bar */}
      <div className="flex-shrink-0 border-b border-th-border/60 dark:border-white/[0.06]">
        {/* Top row: Title/view + Actions */}
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          {/* Mobile: view dropdown */}
          <div className="lg:hidden flex-1 max-w-[200px]">
            <Select
              value={activeView}
              onChange={(v) => setActiveView(v as TicketView)}
              options={isAdminView ? adminViewOptions : userViewOptions}
            />
          </div>

          {/* Title (desktop) */}
          <div className="hidden lg:flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-foreground">Tickets</h2>
            <span className="text-[11px] font-medium text-foreground-muted bg-surface-tertiary/80 px-2 py-0.5 rounded-full tabular-nums">
              {filteredTickets.length}
            </span>
          </div>

          {/* New ticket button */}
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-[12px] font-medium transition-all duration-[180ms] shadow-sm hover:shadow-glow active:scale-[0.97]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nouveau</span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, clé ou description..."
              className="w-full h-8 pl-9 pr-3 text-[13px] rounded-xl border border-th-border dark:border-white/[0.1] bg-surface-secondary/50 dark:bg-white/[0.03] text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-surface transition-all duration-[180ms]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          <span className="text-foreground-muted flex items-center gap-1">
            <FilterIcon />
          </span>

          <div className="w-[120px]">
            <MultiSelect
              values={filters.statuses}
              onChange={(v) => setFilters({ ...filters, statuses: v })}
              options={statusOptions}
              placeholder="Statut"
              allLabel="Statut"
            />
          </div>
          <div className="w-[120px]">
            <MultiSelect
              values={filters.priorities}
              onChange={(v) => setFilters({ ...filters, priorities: v })}
              options={priorityOptions}
              placeholder="Priorité"
              allLabel="Priorité"
            />
          </div>
          {isAdminView && (
            <>
              <div className="w-[120px]">
                <MultiSelect
                  values={filters.types}
                  onChange={(v) => setFilters({ ...filters, types: v })}
                  options={typeOptions}
                  placeholder="Type"
                  allLabel="Type"
                />
              </div>
              <div className="w-[130px]">
                <MultiSelect
                  values={filters.assignees}
                  onChange={(v) => setFilters({ ...filters, assignees: v })}
                  options={assigneeOptions}
                  placeholder="Assigné"
                  allLabel="Assigné"
                />
              </div>
            </>
          )}
          {hasActiveFilters && (
            <button
              onClick={() =>
                setFilters({ statuses: [], priorities: [], types: [], assignees: [] })
              }
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover font-medium transition-colors px-1.5 py-0.5 rounded hover:bg-accent/5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoadingList ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-tertiary/60 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-foreground-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-secondary">Aucun ticket trouvé</p>
            {(search || hasActiveFilters) && (
              <p className="text-xs text-foreground-muted mt-1.5">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface/95 dark:bg-[#0d0d14]/95 backdrop-blur-sm border-b border-th-border/40 dark:border-white/[0.04]">
              <tr>
                <th className="pl-4 pr-2 py-2.5 text-left w-[100px]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted/70">ID / Type</span>
                </th>
                <ThCell label="Description" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <ThCell label="Demandeur" field="requester" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden lg:table-cell" />
                <ThCell label="Statut" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <ThCell label="Priorité" field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden sm:table-cell" />
                <th className="px-2 py-2.5 text-left hidden xl:table-cell">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted/70">SLA</span>
                </th>
                <ThCell label="Date" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden md:table-cell" />
                {isAdminView && (
                  <ThCell label="Assigné" field="assignee" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 pr-4 hidden lg:table-cell" />
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map((ticket) => (
                <TicketTableRow
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicketId === ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  showAssignee={isAdminView}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TABLE ROW
// ============================================================================

function TicketTableRow({
  ticket,
  isSelected,
  onClick,
  showAssignee,
}: {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
  showAssignee: boolean;
}) {
  const assigneeInitials = ticket.assignedAdmin
    ? `${ticket.assignedAdmin.firstName[0]}${ticket.assignedAdmin.lastName[0]}`
    : null;

  return (
    <tr
      onClick={onClick}
      className={`
        group cursor-pointer border-b border-th-border/20 dark:border-white/[0.03] transition-all duration-[120ms]
        ${isSelected
          ? 'bg-accent/[0.06] dark:bg-accent/[0.06]'
          : 'hover:bg-surface-hover/60 dark:hover:bg-white/[0.02]'
        }
      `}
    >
      {/* ID / Type */}
      <td className="pl-4 pr-2 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-mono text-foreground-muted/80 tracking-tight">{ticket.key}</span>
          <span className="text-[10px] text-foreground-muted/50">
            {TYPE_LABELS[ticket.type] || ticket.type}
          </span>
        </div>
      </td>

      {/* Description / Title */}
      <td className="px-2 py-3 max-w-[300px]">
        <p className={`text-[13px] font-medium leading-snug line-clamp-1 ${isSelected ? 'text-accent' : 'text-foreground'}`}>
          {ticket.title}
        </p>
        {ticket.description && (
          <p className="text-[11px] text-foreground-muted/45 mt-0.5 line-clamp-1">
            {ticket.description}
          </p>
        )}
      </td>

      {/* Demandeur */}
      <td className="px-2 py-3 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent/10 dark:bg-accent/15 flex items-center justify-center text-[9px] font-bold text-accent flex-shrink-0">
            {ticket.requesterFirstName[0]}{ticket.requesterLastName[0]}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-foreground truncate">
              {ticket.requesterFirstName} {ticket.requesterLastName}
            </p>
            <p className="text-[10px] text-foreground-muted/50 truncate">
              {ticket.requesterEmail}
            </p>
          </div>
        </div>
      </td>

      {/* Statut */}
      <td className="px-2 py-3">
        <TicketStatusBadge status={ticket.status} size="sm" />
      </td>

      {/* Priorité */}
      <td className="px-2 py-3 hidden sm:table-cell">
        <TicketPriorityBadge priority={ticket.priority} size="sm" />
      </td>

      {/* SLA */}
      <td className="px-2 py-3 hidden xl:table-cell">
        <SlaIndicator ticket={ticket} />
      </td>

      {/* Date */}
      <td className="px-2 py-3 hidden md:table-cell">
        <div className="flex flex-col">
          <span className="text-[11px] text-foreground-muted tabular-nums">
            {formatDateTime(ticket.createdAt)}
          </span>
          <span className="text-[10px] text-foreground-muted/40">
            {relativeDate(ticket.createdAt)}
          </span>
        </div>
      </td>

      {/* Assigné */}
      {showAssignee && (
        <td className="px-2 py-3 pr-4 hidden lg:table-cell">
          {assigneeInitials ? (
            <div className="flex items-center gap-2">
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
                ${isSelected ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent/80'}
              `}>
                {assigneeInitials}
              </span>
              <span className="text-[12px] text-foreground-secondary truncate">
                {ticket.assignedAdmin?.firstName}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-foreground-muted/40 italic">
              Non assigné
            </span>
          )}
        </td>
      )}
    </tr>
  );
}

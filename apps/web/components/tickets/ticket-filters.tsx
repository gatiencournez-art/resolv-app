'use client';

import { MultiSelect } from '@/components/ui';
import type { MultiSelectOption } from '@/components/ui';
import { User } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface TicketFiltersProps {
  search: string;
  statuses: string[];
  priorities: string[];
  types: string[];
  assignees: string[];
  onSearchChange: (value: string) => void;
  onStatusesChange: (values: string[]) => void;
  onPrioritiesChange: (values: string[]) => void;
  onTypesChange: (values: string[]) => void;
  onAssigneesChange: (values: string[]) => void;
  showTypeFilter?: boolean;
  showAssigneeFilter?: boolean;
  admins?: User[];
}

// ============================================================================
// OPTIONS
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
  { value: 'MEDIUM', label: 'Normale', dot: 'bg-[var(--priority-medium)]' },
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
// COMPONENT
// ============================================================================

export function TicketFilters({
  search,
  statuses,
  priorities,
  types,
  assignees,
  onSearchChange,
  onStatusesChange,
  onPrioritiesChange,
  onTypesChange,
  onAssigneesChange,
  showTypeFilter = false,
  showAssigneeFilter = false,
  admins = [],
}: TicketFiltersProps) {
  const hasFilters = statuses.length > 0 || priorities.length > 0 || types.length > 0 || assignees.length > 0;

  const assigneeOptions: MultiSelectOption[] = [
    { value: '__unassigned__', label: 'Non assigné', icon: (
      <span className="w-5 h-5 rounded-full bg-foreground-muted/20 flex items-center justify-center text-[9px] text-foreground-muted">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </span>
    )},
    ...admins.map((admin) => ({
      value: admin.id,
      label: `${admin.firstName} ${admin.lastName}`,
      avatar: `${admin.firstName[0]}${admin.lastName[0]}`,
    })),
  ];

  const clearAll = () => {
    onStatusesChange([]);
    onPrioritiesChange([]);
    onTypesChange([]);
    onAssigneesChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Search + filters row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un ticket..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`
              w-full h-9 pl-10 pr-4 text-sm rounded-xl border transition-all duration-200
              bg-white/[0.04] dark:bg-white/[0.04]
              border-white/[0.1] dark:border-white/[0.1] border-[var(--border)]
              text-foreground placeholder-foreground-muted
              hover:border-white/[0.2] dark:hover:border-white/[0.2] hover:border-[var(--border-secondary)]
              focus:outline-none focus:ring-2 focus:ring-accent/40
            `}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2">
          <div className="w-44">
            <MultiSelect
              values={statuses}
              onChange={onStatusesChange}
              options={statusOptions}
              allLabel="Statut"
              placeholder="Statut"
            />
          </div>

          <div className="w-44">
            <MultiSelect
              values={priorities}
              onChange={onPrioritiesChange}
              options={priorityOptions}
              allLabel="Priorité"
              placeholder="Priorité"
            />
          </div>

          {showTypeFilter && (
            <div className="w-44">
              <MultiSelect
                values={types}
                onChange={onTypesChange}
                options={typeOptions}
                allLabel="Type"
                placeholder="Type"
              />
            </div>
          )}

          {showAssigneeFilter && admins.length > 0 && (
            <div className="w-52">
              <MultiSelect
                values={assignees}
                onChange={onAssigneesChange}
                options={assigneeOptions}
                allLabel="Assigné à"
                placeholder="Assigné à"
              />
            </div>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-foreground-muted">Filtres actifs :</span>

          {statuses.map((s) => {
            const opt = statusOptions.find((o) => o.value === s);
            return opt ? (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/15">
                {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                {opt.label}
              </span>
            ) : null;
          })}

          {priorities.map((p) => {
            const opt = priorityOptions.find((o) => o.value === p);
            return opt ? (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/15">
                {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                {opt.label}
              </span>
            ) : null;
          })}

          {types.map((t) => {
            const opt = typeOptions.find((o) => o.value === t);
            return opt ? (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/15">
                {opt.label}
              </span>
            ) : null;
          })}

          {assignees.map((a) => {
            const opt = assigneeOptions.find((o) => o.value === a);
            return opt ? (
              <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/15">
                {opt.label}
              </span>
            ) : null;
          })}

          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-foreground-muted hover:text-accent transition-colors font-medium ml-1 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Effacer tout
          </button>
        </div>
      )}
    </div>
  );
}

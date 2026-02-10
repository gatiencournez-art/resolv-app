'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '@/lib/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  Legend,
} from 'recharts';
import { DateRangePicker } from '@/components/ui/date-range-picker';

// ============================================================================
// TYPES
// ============================================================================

type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'custom';

interface PeriodOption {
  key: PeriodKey;
  label: string;
  getRange: () => { from: Date; to: Date };
}

// ============================================================================
// PERIOD HELPERS
// ============================================================================

function getPeriodOptions(): PeriodOption[] {
  return [
    {
      key: 'today',
      label: "Aujourd'hui",
      getRange: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        };
      },
    },
    {
      key: 'week',
      label: 'Cette semaine',
      getRange: () => {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        return { from, to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) };
      },
    },
    {
      key: 'month',
      label: 'Ce mois-ci',
      getRange: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        };
      },
    },
    {
      key: 'quarter',
      label: 'Ce trimestre',
      getRange: () => {
        const now = new Date();
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        return {
          from: new Date(now.getFullYear(), qMonth, 1),
          to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        };
      },
    },
  ];
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

// ============================================================================
// CHART COLORS & LABELS
// ============================================================================

const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: '#818cf8',
  IN_PROGRESS: '#fbbf24',
  ON_HOLD: '#71717a',
  RESOLVED: '#4ade80',
  CLOSED: '#52525b',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const TYPE_LABELS: Record<TicketType, string> = {
  SOFTWARE: 'Logiciel',
  HARDWARE: 'Matériel',
  ACCESS: 'Accès',
  ONBOARDING: 'Onboarding',
  OFFBOARDING: 'Offboarding',
  OTHER: 'Autre',
};


const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'var(--priority-low)',
  MEDIUM: 'var(--priority-medium)',
  HIGH: 'var(--priority-high)',
  CRITICAL: 'var(--priority-critical)',
};

// ============================================================================
// TOOLTIP
// ============================================================================

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-surface border border-th-border px-3 py-2 shadow-xl">
      {label && <p className="text-[11px] text-foreground-muted mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-foreground-secondary">{entry.name}</span>
          <span className="text-foreground font-semibold ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PERIOD SELECTOR
// ============================================================================

function PeriodSelector({
  activePeriod,
  onSelect,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustom,
}: {
  activePeriod: PeriodKey;
  onSelect: (key: PeriodKey) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
  onApplyCustom: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const periods = getPeriodOptions();

  const activeLabel = activePeriod === 'custom' && customFrom && customTo
    ? `${formatDateShort(new Date(customFrom))} – ${formatDateShort(new Date(customTo))}`
    : periods.find((p) => p.key === activePeriod)?.label || 'Ce mois-ci';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-surface border border-th-border hover:border-th-border-secondary text-sm font-medium text-foreground transition-all duration-150"
      >
        <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span>{activeLabel}</span>
        <svg className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl bg-surface border border-th-border shadow-2xl">
            <div className="p-1.5">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => { onSelect(p.key); setIsOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-100 ${
                    activePeriod === p.key
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="px-4 py-4">
              <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider mb-3">
                Période personnalisée
              </p>
              <DateRangePicker
                from={customFrom}
                to={customTo}
                onChangeFrom={onCustomFromChange}
                onChangeTo={onCustomToChange}
                onApply={() => { onApplyCustom(); setIsOpen(false); }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  label,
  count,
  icon,
  bgColor,
  href,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-th-border hover:border-th-border-secondary hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-150 text-left cursor-pointer overflow-hidden"
    >
      <div className="flex items-center justify-between relative">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${bgColor}18` }}>
          <span style={{ color: bgColor }}>{icon}</span>
        </div>
        <span className="text-[28px] font-bold text-foreground tabular-nums leading-none">{count}</span>
      </div>
      <span className="text-[13px] text-foreground-secondary font-medium group-hover:text-foreground transition-colors relative">
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// CHART CARD — no border, no grey hover
// ============================================================================

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-surface border border-th-border p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ============================================================================
// STATUS BAR CHART (was pie, now bar)
// ============================================================================

function StatusBarChart({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const data = useMemo(() => {
    const statuses: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
    return statuses
      .map((s) => ({
        name: STATUS_LABELS[s],
        value: tickets.filter((t) => t.status === s).length,
        status: s,
        fill: STATUS_COLORS[s],
      }))
      .filter((d) => d.value > 0);
  }, [tickets]);

  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={false} />
          <Bar
            dataKey="value"
            name="Tickets"
            radius={[6, 6, 0, 0]}
            className="recharts-no-outline"
            onClick={(_entry, index) => {
              const d = data[index];
              if (d?.status) router.push(`/tickets?status=${d.status}`);
            }}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} className="recharts-no-outline" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// TYPE PIE CHART (was bar, now pie — full circle)
// ============================================================================

const TYPE_COLORS_MAP: Record<TicketType, string> = {
  SOFTWARE: '#818cf8',
  HARDWARE: '#f472b6',
  ACCESS: '#fbbf24',
  ONBOARDING: '#4ade80',
  OFFBOARDING: '#38bdf8',
  OTHER: '#a78bfa',
};

function TypePieChart({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const data = useMemo(() => {
    const types: TicketType[] = ['SOFTWARE', 'HARDWARE', 'ACCESS', 'ONBOARDING', 'OFFBOARDING', 'OTHER'];
    return types
      .map((t) => ({
        name: TYPE_LABELS[t],
        value: tickets.filter((tk) => tk.type === t).length,
        type: t,
        fill: TYPE_COLORS_MAP[t],
      }))
      .filter((d) => d.value > 0);
  }, [tickets]);

  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={0}
            outerRadius={90}
            paddingAngle={0}
            dataKey="value"
            stroke="var(--surface)"
            strokeWidth={2}
            className="recharts-no-outline"
            onClick={(entry) => {
              if (entry?.type) router.push(`/tickets?type=${entry.type}`);
            }}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} className="recharts-no-outline" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} cursor={false} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span className="text-xs text-foreground-secondary">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// CREATED OVER TIME AREA CHART
// ============================================================================

function CreatedOverTimeChart({ tickets, dateRange }: { tickets: Ticket[]; dateRange: { from: Date; to: Date } }) {
  const data = useMemo(() => {
    const days = daysBetween(dateRange.from, dateRange.to);
    const useWeeks = days > 60;
    const buckets: Record<string, number> = {};

    tickets.forEach((t) => {
      const d = new Date(t.createdAt);
      let key: string;
      if (useWeeks) {
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        key = formatDateInput(weekStart);
      } else {
        key = formatDateInput(d);
      }
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const result: { date: string; label: string; count: number }[] = [];
    const step = useWeeks ? 7 : 1;
    const cur = new Date(dateRange.from);

    while (cur <= dateRange.to) {
      const key = formatDateInput(cur);
      result.push({
        date: key,
        label: cur.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        count: buckets[key] || 0,
      });
      cur.setDate(cur.getDate() + step);
    }

    return result;
  }, [tickets, dateRange]);

  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradientCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={false} />
        <Area type="monotone" dataKey="count" name="Créés" stroke="#818cf8" fill="url(#gradientCreated)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// EMPTY CHART PLACEHOLDER
// ============================================================================

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-foreground-muted text-sm">
      Aucune donnée sur cette période
    </div>
  );
}

// ============================================================================
// RECENT TICKETS TABLE
// ============================================================================

const STATUS_DOT: Record<TicketStatus, string> = {
  NEW: 'bg-[var(--status-new)]',
  IN_PROGRESS: 'bg-[var(--status-progress)]',
  ON_HOLD: 'bg-[var(--status-hold)]',
  RESOLVED: 'bg-[var(--status-resolved)]',
  CLOSED: 'bg-[var(--status-closed)]',
};

function RecentTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">Aucun ticket sur cette période</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Ticket</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Statut</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Priorité</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider hidden md:table-cell">Demandeur</th>
            <th className="text-right py-3 px-4 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider hidden sm:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
              className="hover:bg-surface-hover transition-colors cursor-pointer group"
            >
              <td className="py-3.5 px-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {ticket.title}
                  </span>
                  <span className="text-[11px] text-foreground-muted">{ticket.key}</span>
                </div>
              </td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[ticket.status]}`} />
                  {STATUS_LABELS[ticket.status]}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className="text-xs font-medium" style={{ color: PRIORITY_COLORS[ticket.priority] }}>
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
              </td>
              <td className="py-3.5 px-4 hidden md:table-cell">
                <span className="text-sm text-foreground-secondary">
                  {ticket.requesterFirstName} {ticket.requesterLastName}
                </span>
              </td>
              <td className="py-3.5 px-4 text-right hidden sm:table-cell">
                <span className="text-xs text-foreground-muted">
                  {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function AccueilSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-xl bg-surface-tertiary" />
        <div className="h-10 w-44 rounded-2xl bg-surface-tertiary" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[110px] rounded-2xl bg-surface-tertiary" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[320px] rounded-2xl bg-surface-tertiary" />
        ))}
      </div>
      <div className="h-[320px] rounded-2xl bg-surface-tertiary" />
      <div className="h-[360px] rounded-2xl bg-surface-tertiary" />
    </div>
  );
}

// ============================================================================
// ICONS FOR STAT CARDS
// ============================================================================

const cardIcons = {
  total: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  new: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  inProgress: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  onHold: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  ),
  resolved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  closed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  overdue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  urgent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  ),
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AccueilPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Period state
  const [activePeriod, setActivePeriod] = useState<PeriodKey>(() => {
    if (typeof window === 'undefined') return 'month';
    return (localStorage.getItem('resolv-dashboard-range') as PeriodKey) || 'month';
  });
  const [customFrom, setCustomFrom] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('resolv-dashboard-custom-from') || '';
  });
  const [customTo, setCustomTo] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('resolv-dashboard-custom-to') || '';
  });

  useEffect(() => {
    localStorage.setItem('resolv-dashboard-range', activePeriod);
  }, [activePeriod]);

  useEffect(() => {
    if (customFrom) localStorage.setItem('resolv-dashboard-custom-from', customFrom);
    if (customTo) localStorage.setItem('resolv-dashboard-custom-to', customTo);
  }, [customFrom, customTo]);

  const dateRange = useMemo(() => {
    if (activePeriod === 'custom' && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59.999') };
    }
    const periods = getPeriodOptions();
    const selected = periods.find((p) => p.key === activePeriod);
    return selected ? selected.getRange() : getPeriodOptions()[2].getRange();
  }, [activePeriod, customFrom, customTo]);

  const fetchTickets = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const allTickets: Ticket[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = (await api.getTickets(token, { limit: '100', page: String(page) })) as {
          data: Ticket[];
          meta: { totalPages: number };
        };
        allTickets.push(...(res.data || []));
        totalPages = res.meta?.totalPages || 1;
        page++;
      } while (page <= totalPages && page <= 10);

      setTickets(allTickets);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number };
      if (apiErr.statusCode === 401) {
        router.push('/login');
        return;
      }
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchTickets();
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchTickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const created = new Date(t.createdAt);
      if (created < dateRange.from || created > dateRange.to) return false;
      if (user?.role === 'USER' && t.createdByUserId !== user.id) return false;
      return true;
    });
  }, [tickets, dateRange, user]);

  const stats = useMemo(() => {
    const byStatus = (s: TicketStatus) => filteredTickets.filter((t) => t.status === s).length;
    const overdue = filteredTickets.filter((t) => t.slaBreachedAt && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
    const urgent = filteredTickets.filter((t) => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

    return [
      { key: 'total', label: 'Total tickets', count: filteredTickets.length, icon: cardIcons.total, color: '#818cf8', bgColor: '#818cf8', href: '/tickets' },
      { key: 'new', label: 'Nouveaux', count: byStatus('NEW'), icon: cardIcons.new, color: '#818cf8', bgColor: '#818cf8', href: '/tickets?status=NEW' },
      { key: 'in_progress', label: 'En cours', count: byStatus('IN_PROGRESS'), icon: cardIcons.inProgress, color: '#fbbf24', bgColor: '#fbbf24', href: '/tickets?status=IN_PROGRESS' },
      { key: 'on_hold', label: 'En attente', count: byStatus('ON_HOLD'), icon: cardIcons.onHold, color: '#71717a', bgColor: '#71717a', href: '/tickets?status=ON_HOLD' },
      { key: 'resolved', label: 'Résolus', count: byStatus('RESOLVED'), icon: cardIcons.resolved, color: '#4ade80', bgColor: '#4ade80', href: '/tickets?status=RESOLVED' },
      { key: 'closed', label: 'Fermés', count: byStatus('CLOSED'), icon: cardIcons.closed, color: '#52525b', bgColor: '#52525b', href: '/tickets?status=CLOSED' },
      { key: 'overdue', label: 'En retard', count: overdue, icon: cardIcons.overdue, color: '#fbbf24', bgColor: '#fbbf24', href: '/tickets?view=overdue' },
      { key: 'urgent', label: 'Urgents / Critiques', count: urgent, icon: cardIcons.urgent, color: '#f87171', bgColor: '#f87171', href: '/tickets?view=high_priority' },
    ];
  }, [filteredTickets, dateRange]);

  const recentTickets = useMemo(() => {
    return [...filteredTickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [filteredTickets]);

  if (authLoading || (isLoading && tickets.length === 0)) {
    return <AccueilSkeleton />;
  }

  if (error && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Accueil</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-12 h-12 text-foreground-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-base font-medium text-foreground">Impossible de charger les données</p>
          <p className="mt-1 text-sm text-foreground-muted">Vérifiez que le serveur est en cours d&apos;exécution.</p>
          <button
            onClick={fetchTickets}
            className="mt-6 px-5 py-2.5 rounded-2xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accueil</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {user?.role === 'ADMIN' ? 'Vue globale de l\'organisation' : 'Vos tickets'}
          </p>
        </div>
        <PeriodSelector
          activePeriod={activePeriod}
          onSelect={setActivePeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onApplyCustom={() => { if (customFrom && customTo && customFrom <= customTo) setActivePeriod('custom'); }}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} count={s.count} icon={s.icon} color={s.color} bgColor={s.bgColor} href={s.href} />
        ))}
      </div>

      {/* Charts — 2 columns top, full-width below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Répartition par statut">
          <StatusBarChart tickets={filteredTickets} />
        </ChartCard>
        <ChartCard title="Tickets par type">
          <TypePieChart tickets={filteredTickets} />
        </ChartCard>
      </div>
      <ChartCard title="Tickets créés dans le temps">
        <CreatedOverTimeChart tickets={filteredTickets} dateRange={dateRange} />
      </ChartCard>

      {/* Recent Tickets */}
      <div className="rounded-2xl bg-surface border border-th-border overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Tickets récents</h2>
        </div>
        <RecentTicketsTable tickets={recentTickets} />
      </div>
    </div>
  );
}

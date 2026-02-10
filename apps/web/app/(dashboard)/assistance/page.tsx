'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth';
import { Ticket, TicketStatus } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

type Period = 'today' | 'week' | 'month' | 'all';

interface TicketStats {
  total: number;
  new: number;
  inProgress: number;
  onHold: number;
  resolved: number;
  closed: number;
  overdue: number;
  urgent: number;
  slaRespected: number;
  avgResolutionTime: number;
}

// ============================================================================
// ICONS
// ============================================================================

function TicketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ============================================================================
// PERIOD SELECTOR
// ============================================================================

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (val: Period) => void;
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const periods: { value: Period; label: string }[] = [
    { value: 'today', label: language === 'en' ? 'Today' : "Aujourd'hui" },
    { value: 'week', label: language === 'en' ? 'This week' : 'Cette semaine' },
    { value: 'month', label: language === 'en' ? 'This month' : 'Ce mois-ci' },
    { value: 'all', label: language === 'en' ? 'All time' : 'Tout le temps' },
  ];

  const currentLabel = periods.find((p) => p.value === value)?.label || '';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-white/[0.04] hover:bg-white/[0.06]
          border border-white/[0.08] hover:border-white/[0.12]
          text-sm font-medium text-white/80 hover:text-white
          transition-all duration-150
        "
      >
        <CalendarIcon />
        <span>{currentLabel}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 py-1.5 rounded-xl bg-[#1a1a2e] border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-50 animate-fade-in">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  onChange(p.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm transition-colors
                  ${value === p.value
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                  }
                `}
              >
                {p.label}
              </button>
            ))}
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
  title,
  value,
  icon,
  color,
  trend,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'indigo' | 'teal' | 'slate';
  trend?: number;
  onClick?: () => void;
}) {
  const colorConfig = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/5',
      icon: 'text-blue-400',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
      border: 'border-blue-500/20 hover:border-blue-500/30',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/5',
      icon: 'text-emerald-400',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]',
      border: 'border-emerald-500/20 hover:border-emerald-500/30',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/5',
      icon: 'text-amber-400',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]',
      border: 'border-amber-500/20 hover:border-amber-500/30',
    },
    rose: {
      bg: 'from-rose-500/20 to-rose-600/5',
      icon: 'text-rose-400',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.1)]',
      border: 'border-rose-500/20 hover:border-rose-500/30',
    },
    violet: {
      bg: 'from-violet-500/20 to-violet-600/5',
      icon: 'text-violet-400',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.1)]',
      border: 'border-violet-500/20 hover:border-violet-500/30',
    },
    indigo: {
      bg: 'from-indigo-500/20 to-indigo-600/5',
      icon: 'text-indigo-400',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.1)]',
      border: 'border-indigo-500/20 hover:border-indigo-500/30',
    },
    teal: {
      bg: 'from-teal-500/20 to-teal-600/5',
      icon: 'text-teal-400',
      glow: 'shadow-[0_0_30px_rgba(20,184,166,0.1)]',
      border: 'border-teal-500/20 hover:border-teal-500/30',
    },
    slate: {
      bg: 'from-slate-500/20 to-slate-600/5',
      icon: 'text-slate-400',
      glow: 'shadow-[0_0_30px_rgba(100,116,139,0.1)]',
      border: 'border-slate-500/20 hover:border-slate-500/30',
    },
  };

  const cfg = colorConfig[color];

  return (
    <button
      onClick={onClick}
      className={`
        relative group p-5 rounded-2xl text-left
        bg-gradient-to-br ${cfg.bg}
        border ${cfg.border}
        ${cfg.glow}
        transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center ${cfg.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-white/50">{title}</p>
    </button>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<TicketStatus, { label: string; color: string }> = {
    NEW: { label: 'Nouveau', color: 'bg-blue-500/15 text-blue-400' },
    IN_PROGRESS: { label: 'En cours', color: 'bg-amber-500/15 text-amber-400' },
    ON_HOLD: { label: 'En attente', color: 'bg-slate-500/15 text-slate-400' },
    RESOLVED: { label: 'Résolu', color: 'bg-emerald-500/15 text-emerald-400' },
    CLOSED: { label: 'Fermé', color: 'bg-violet-500/15 text-violet-400' },
  };

  const cfg = config[status] || config.NEW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  );
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Basse', color: 'text-slate-400' },
    MEDIUM: { label: 'Moyenne', color: 'text-blue-400' },
    HIGH: { label: 'Haute', color: 'text-amber-400' },
    CRITICAL: { label: 'Critique', color: 'text-rose-400' },
  };

  const cfg = config[priority] || config.MEDIUM;

  return (
    <span className={`text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
      </div>
      <div className="h-8 w-16 bg-white/[0.05] rounded mb-2" />
      <div className="h-4 w-24 bg-white/[0.03] rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] animate-pulse">
          <div className="h-4 w-16 bg-white/[0.05] rounded" />
          <div className="h-4 flex-1 bg-white/[0.05] rounded" />
          <div className="h-6 w-20 bg-white/[0.05] rounded-full" />
          <div className="h-4 w-16 bg-white/[0.05] rounded" />
          <div className="h-4 w-24 bg-white/[0.05] rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying?: boolean }) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {language === 'en' ? 'Connection error' : 'Erreur de connexion'}
      </h3>
      <p className="text-sm text-white/50 text-center max-w-md mb-6">
        {language === 'en'
          ? 'Unable to connect to the server. Please check that the backend is running.'
          : 'Connexion au serveur impossible. Vérifiez que le backend est lancé.'}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
      >
        <span className={isRetrying ? 'animate-spin' : ''}>
          <RefreshIcon />
        </span>
        {isRetrying
          ? (language === 'en' ? 'Retrying...' : 'Tentative...')
          : (language === 'en' ? 'Retry' : 'Réessayer')
        }
      </button>
    </div>
  );
}

// ============================================================================
// CHARTS
// ============================================================================

const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  ON_HOLD: '#64748b',
  RESOLVED: '#10b981',
  CLOSED: '#8b5cf6',
};

function StatusPieChart({ data }: { data: { name: string; value: number; status: TicketStatus }[] }) {
  const filteredData = data.filter((d) => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">
        Aucune donnée
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {filteredData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status]}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
          }}
          labelStyle={{ color: 'white', fontWeight: 600 }}
          itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TrendAreaChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">
        Aucune donnée
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
          }}
          labelStyle={{ color: 'white', fontWeight: 600 }}
          itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#colorCount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// RECENT TICKETS TABLE
// ============================================================================

function RecentTicketsTable({
  tickets,
  onTicketClick,
}: {
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
}) {
  const { language } = useLanguage();

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-white/40 text-sm">
        {language === 'en' ? 'No recent tickets' : 'Aucun ticket récent'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onTicketClick(ticket.id)}
          className="
            w-full flex items-center gap-4 p-4 rounded-xl text-left
            bg-white/[0.02] hover:bg-white/[0.04]
            border border-transparent hover:border-white/[0.08]
            transition-all duration-150
            group
          "
        >
          <span className="text-xs font-mono text-white/40 w-20 shrink-0">
            {ticket.key}
          </span>
          <span className="flex-1 text-sm text-white truncate group-hover:text-accent transition-colors">
            {ticket.title}
          </span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-white/40 w-28 text-right shrink-0">
            {ticket.requesterFirstName} {ticket.requesterLastName?.[0]}.
          </span>
          <span className="text-xs text-white/30 w-20 text-right shrink-0">
            {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// ASSISTANCE PAGE
// ============================================================================

export default function AssistancePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<Period>('week');

  // Fetch tickets using centralized token refresh
  const fetchTickets = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) {
      // No valid token → don't show network error, just stop loading
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const res = (await api.getTickets(token, { limit: '100' })) as { data: Ticket[] };
      setTickets(res.data || []);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number };
      if (apiErr.statusCode === 401) {
        // Auth failed after refresh attempt → redirect to login
        router.push('/login');
        return;
      }
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch when user is available (auth ready)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchTickets]);

  // Filter tickets by period
  const filteredTickets = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return tickets.filter((ticket) => {
      const createdAt = new Date(ticket.createdAt);
      switch (period) {
        case 'today':
          return createdAt >= startOfDay;
        case 'week':
          return createdAt >= startOfWeek;
        case 'month':
          return createdAt >= startOfMonth;
        default:
          return true;
      }
    });
  }, [tickets, period]);

  // Calculate stats
  const stats: TicketStats = useMemo(() => {
    const now = new Date();
    const overdue = filteredTickets.filter(
      (t) => t.slaBreachedAt && new Date(t.slaBreachedAt) < now && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
    ).length;

    const urgent = filteredTickets.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;

    const resolved = filteredTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const avgTime =
      resolved.length > 0
        ? resolved.reduce((acc, t) => {
            const created = new Date(t.createdAt).getTime();
            const resolvedAt = t.resolvedAt ? new Date(t.resolvedAt).getTime() : Date.now();
            return acc + (resolvedAt - created);
          }, 0) /
          resolved.length /
          (1000 * 60 * 60)
        : 0;

    const withSla = filteredTickets.filter((t) => t.slaBreachedAt !== null);
    const slaRespected =
      withSla.length > 0
        ? Math.round(((withSla.length - overdue) / withSla.length) * 100)
        : 100;

    return {
      total: filteredTickets.length,
      new: filteredTickets.filter((t) => t.status === 'NEW').length,
      inProgress: filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length,
      onHold: filteredTickets.filter((t) => t.status === 'ON_HOLD').length,
      resolved: filteredTickets.filter((t) => t.status === 'RESOLVED').length,
      closed: filteredTickets.filter((t) => t.status === 'CLOSED').length,
      overdue,
      urgent,
      slaRespected,
      avgResolutionTime: Math.round(avgTime * 10) / 10,
    };
  }, [filteredTickets]);

  // Pie chart data
  const pieData = useMemo(
    () => [
      { name: 'Nouveau', value: stats.new, status: 'NEW' as TicketStatus },
      { name: 'En cours', value: stats.inProgress, status: 'IN_PROGRESS' as TicketStatus },
      { name: 'En attente', value: stats.onHold, status: 'ON_HOLD' as TicketStatus },
      { name: 'Résolu', value: stats.resolved, status: 'RESOLVED' as TicketStatus },
      { name: 'Fermé', value: stats.closed, status: 'CLOSED' as TicketStatus },
    ],
    [stats]
  );

  // Trend chart data
  const trendData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    const daysCount = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90;

    // Initialize days
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      days[key] = 0;
    }

    // Count tickets per day
    filteredTickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt);
      const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (days[key] !== undefined) {
        days[key]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [filteredTickets, period]);

  // Recent tickets (last 10)
  const recentTickets = useMemo(
    () =>
      [...filteredTickets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    [filteredTickets]
  );

  // Navigate to tickets with filter
  const navigateToTickets = (filter?: string) => {
    const params = filter ? `?status=${filter}` : '';
    router.push(`/tickets${params}`);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {language === 'en' ? 'Assistance' : 'Assistance'}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {language === 'en' ? 'IT Support Overview' : 'Vue d\'ensemble du support IT'}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {error ? (
        <ErrorState onRetry={fetchTickets} isRetrying={isLoading} />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  title={language === 'en' ? 'Total tickets' : 'Total tickets'}
                  value={stats.total}
                  icon={<TicketIcon />}
                  color="indigo"
                  onClick={() => navigateToTickets()}
                />
                <StatCard
                  title={language === 'en' ? 'New' : 'Nouveaux'}
                  value={stats.new}
                  icon={<SparkleIcon />}
                  color="blue"
                  onClick={() => navigateToTickets('NEW')}
                />
                <StatCard
                  title={language === 'en' ? 'In progress' : 'En cours'}
                  value={stats.inProgress}
                  icon={<PlayIcon />}
                  color="amber"
                  onClick={() => navigateToTickets('IN_PROGRESS')}
                />
                <StatCard
                  title={language === 'en' ? 'On hold' : 'En attente'}
                  value={stats.onHold}
                  icon={<PauseIcon />}
                  color="slate"
                  onClick={() => navigateToTickets('ON_HOLD')}
                />
                <StatCard
                  title={language === 'en' ? 'Resolved' : 'Résolus'}
                  value={stats.resolved}
                  icon={<CheckCircleIcon />}
                  color="emerald"
                  onClick={() => navigateToTickets('RESOLVED')}
                />
                <StatCard
                  title={language === 'en' ? 'Closed' : 'Fermés'}
                  value={stats.closed}
                  icon={<ArchiveIcon />}
                  color="violet"
                  onClick={() => navigateToTickets('CLOSED')}
                />
                <StatCard
                  title={language === 'en' ? 'Overdue' : 'En retard'}
                  value={stats.overdue}
                  icon={<ClockIcon />}
                  color="rose"
                />
                <StatCard
                  title={language === 'en' ? 'Urgent' : 'Urgents'}
                  value={stats.urgent}
                  icon={<AlertIcon />}
                  color="rose"
                />
                <StatCard
                  title={language === 'en' ? 'SLA respected' : 'SLA respecté'}
                  value={`${stats.slaRespected}%`}
                  icon={<ShieldIcon />}
                  color="teal"
                />
                <StatCard
                  title={language === 'en' ? 'Avg resolution' : 'Temps moyen'}
                  value={`${stats.avgResolutionTime}h`}
                  icon={<TrendingUpIcon />}
                  color="indigo"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-1">
                {language === 'en' ? 'Status distribution' : 'Répartition par statut'}
              </h3>
              <p className="text-xs text-white/40 mb-4">
                {language === 'en' ? 'Breakdown of tickets by status' : 'Répartition des tickets par statut'}
              </p>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white/[0.05] border-t-accent animate-spin" />
                </div>
              ) : (
                <>
                  <StatusPieChart data={pieData} />
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {pieData.filter((d) => d.value > 0).map((d) => (
                      <div key={d.status} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[d.status] }}
                        />
                        <span className="text-xs text-white/60">{d.name}</span>
                        <span className="text-xs font-medium text-white/80">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Trend */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-1">
                {language === 'en' ? 'Ticket trend' : 'Tendance des tickets'}
              </h3>
              <p className="text-xs text-white/40 mb-4">
                {language === 'en' ? 'Tickets created over time' : 'Tickets créés sur la période'}
              </p>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white/[0.05] border-t-accent animate-spin" />
                </div>
              ) : (
                <TrendAreaChart data={trendData} />
              )}
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {language === 'en' ? 'Recent tickets' : 'Tickets récents'}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {language === 'en' ? 'Latest created tickets' : 'Derniers tickets créés'}
                </p>
              </div>
              <button
                onClick={() => navigateToTickets()}
                className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {language === 'en' ? 'View all' : 'Voir tout'} →
              </button>
            </div>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <RecentTicketsTable
                tickets={recentTickets}
                onTicketClick={(id) => router.push(`/tickets/${id}`)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

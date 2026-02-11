'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth';
import { Ticket, TicketStatus, TicketPriority } from '@/lib/types';

// ============================================================================
// CONFIG
// ============================================================================

const MAIN_COLUMNS: { status: TicketStatus; label: string; dotColor: string }[] = [
  { status: 'NEW', label: 'Nouveau', dotColor: 'bg-[var(--status-new)]' },
  { status: 'IN_PROGRESS', label: 'En cours', dotColor: 'bg-[var(--status-progress)]' },
  { status: 'ON_HOLD', label: 'En attente', dotColor: 'bg-[var(--status-hold)]' },
  { status: 'RESOLVED', label: 'Résolu', dotColor: 'bg-[var(--status-resolved)]' },
];

const CLOSED_COLUMN = { status: 'CLOSED' as TicketStatus, label: 'Fermé', dotColor: 'bg-[var(--status-closed)]' };

const PRIORITY_INDICATOR: Record<TicketPriority, { label: string; cls: string }> = {
  LOW: { label: 'Basse', cls: 'text-[var(--priority-low)]' },
  MEDIUM: { label: 'Normale', cls: 'text-[var(--priority-medium)]' },
  HIGH: { label: 'Haute', cls: 'text-[var(--priority-high)]' },
  CRITICAL: { label: 'Critique', cls: 'text-[var(--priority-critical)]' },
};

const TYPE_SHORT: Record<string, string> = {
  SOFTWARE: 'Logiciel', HARDWARE: 'Matériel', ACCESS: 'Accès',
  ONBOARDING: 'Onboard', OFFBOARDING: 'Offboard', OTHER: 'Autre',
};

// ============================================================================
// TICKET CARD
// ============================================================================

function TicketCard({
  ticket,
  onDragStart,
}: {
  ticket: Ticket;
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void;
}) {
  const pri = PRIORITY_INDICATOR[ticket.priority];
  const hasSla = ticket.slaBreachedAt !== null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      className="bg-surface rounded-xl border border-th-border p-3.5 cursor-grab active:cursor-grabbing hover:border-accent/30 hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/tickets/${ticket.id}`}
          className="text-[11px] font-mono text-foreground-muted hover:text-accent transition-colors"
        >
          {ticket.key}
        </Link>
        <div className="flex items-center gap-1.5">
          {hasSla && <span title="SLA dépassé" className="text-[var(--priority-critical)] text-xs font-bold">!</span>}
          <span className={`text-xs font-semibold ${pri.cls}`} title={pri.label}>
            {ticket.priority === 'CRITICAL' ? '!!' : ticket.priority === 'HIGH' ? '!' : ''}
          </span>
        </div>
      </div>

      <Link href={`/tickets/${ticket.id}`}>
        <p className="text-[13px] font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
          {ticket.title}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-foreground-muted bg-surface-tertiary px-2 py-1 rounded-lg font-medium">
          {TYPE_SHORT[ticket.type] || ticket.type}
        </span>
        <span className="text-[10px] text-foreground-muted">
          {ticket.requesterFirstName} {ticket.requesterLastName?.[0]}.
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// KANBAN COLUMN
// ============================================================================

function KanbanColumn({
  col,
  tickets,
  onDragStart,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  col: typeof MAIN_COLUMNS[number];
  tickets: Ticket[];
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void;
  onDrop: (e: React.DragEvent, status: TicketStatus) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      className={`flex flex-col flex-1 min-w-[220px] rounded-2xl ${
        isDragOver ? 'bg-accent-muted ring-2 ring-accent/50' : 'bg-surface-tertiary '
      } transition-all duration-150`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.status)}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
          <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
          <span className="text-xs font-medium text-foreground-muted bg-surface px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
      </div>

      <div className="flex-1 px-2.5 pb-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-200px)]">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onDragStart={onDragStart} />
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-10 text-xs text-foreground-muted">Aucun ticket</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// KANBAN PAGE
// ============================================================================

export default function KanbanPage() {
  const { user, isAdminView } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);
  const dragTicketRef = useRef<Ticket | null>(null);

  useEffect(() => {
    if (user && !isAdminView) {
      router.replace('/');
    }
  }, [user, isAdminView, router]);

  useEffect(() => {
    const load = async () => {
      const token = await getValidAccessToken();
      if (!token) return;
      try {
        const res = (await api.getTickets(token, { limit: '100' })) as { data: Ticket[] };
        setTickets(res.data || []);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const handleDragStart = useCallback((_e: React.DragEvent, ticket: Ticket) => {
    dragTicketRef.current = ticket;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  }, []);

  const handleDrop = useCallback(async (_e: React.DragEvent, newStatus: TicketStatus) => {
    setDragOverCol(null);
    const ticket = dragTicketRef.current;
    if (!ticket || ticket.status === newStatus) return;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t)),
    );

    const token = await getValidAccessToken();
    if (!token) return;

    try {
      await api.updateTicketStatus(ticket.id, newStatus, token);
    } catch {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: ticket.status } : t)),
      );
    }
  }, []);

  if (user && !isAdminView) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Suivi des tickets</h1>
        <p className="text-foreground-muted text-sm mt-0.5">Glissez-déposez pour changer le statut</p>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            {MAIN_COLUMNS.map((col) => (
              <div key={col.status} className="rounded-2xl bg-surface-tertiary ">
                <div className="px-4 py-3.5 flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <div className="skeleton h-4 w-20 rounded-lg" />
                </div>
                <div className="px-2.5 pb-3 space-y-2.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-surface rounded-xl border border-th-border dark:border-white/[0.06] p-3.5 space-y-2.5">
                      <div className="skeleton h-3 w-12 rounded" />
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-24 rounded-2xl" />
        </>
      ) : (
        <>
          {/* Main 4 columns */}
          <div className="grid grid-cols-4 gap-4">
            {MAIN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                tickets={tickets.filter((t) => t.status === col.status)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                isDragOver={dragOverCol === col.status}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={() => setDragOverCol(null)}
              />
            ))}
          </div>

          {/* Closed section (horizontal) */}
          <div
            className={`rounded-2xl p-4 transition-all duration-150 ${
              dragOverCol === 'CLOSED'
                ? 'bg-accent-muted ring-2 ring-accent/50'
                : 'bg-surface-tertiary '
            }`}
            onDragOver={(e) => handleDragOver(e, 'CLOSED')}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, 'CLOSED')}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${CLOSED_COLUMN.dotColor}`} />
              <h3 className="text-sm font-semibold text-foreground">{CLOSED_COLUMN.label}</h3>
              <span className="text-xs font-medium text-foreground-muted bg-surface px-2 py-0.5 rounded-full">
                {tickets.filter((t) => t.status === 'CLOSED').length}
              </span>
            </div>
            {tickets.filter((t) => t.status === 'CLOSED').length > 0 ? (
              <div className="grid grid-cols-4 gap-2.5">
                {tickets
                  .filter((t) => t.status === 'CLOSED')
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onDragStart={handleDragStart} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-foreground-muted">Aucun ticket fermé</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

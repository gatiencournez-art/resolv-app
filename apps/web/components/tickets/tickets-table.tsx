'use client';

import Link from 'next/link';
import { Ticket } from '@/lib/types';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
  showAssignee?: boolean;
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-th-border overflow-hidden">
      <div className="px-4 py-3 bg-surface-tertiary">
        <div className="skeleton h-4 w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-t border-th-border flex items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-4 w-48" />
          </div>
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-5 w-16 rounded-md" />
          <div className="skeleton h-4 w-14" />
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function TicketsTable({ tickets, isLoading, showAssignee = false }: TicketsTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-th-border">
        <div className="p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-3 text-sm text-foreground-muted">Aucun ticket trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-th-border overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-th-border">
          <thead>
            <tr className="bg-surface-tertiary">
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Demandeur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Priorité</th>
              {showAssignee && (
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Assigné à</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="group hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/tickets/${ticket.id}`} className="block">
                    <p className="text-xs text-foreground-muted font-mono">{ticket.key}</p>
                    <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                      {ticket.title}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-foreground">{ticket.requesterFirstName} {ticket.requesterLastName}</p>
                  <p className="text-xs text-foreground-muted">{ticket.requesterEmail}</p>
                </td>
                <td className="px-4 py-3.5">
                  <TicketStatusBadge status={ticket.status} size="sm" />
                </td>
                <td className="px-4 py-3.5">
                  <TicketPriorityBadge priority={ticket.priority} size="sm" />
                </td>
                {showAssignee && (
                  <td className="px-4 py-3.5">
                    {ticket.assignedAdmin ? (
                      <p className="text-sm text-foreground">{ticket.assignedAdmin.firstName} {ticket.assignedAdmin.lastName}</p>
                    ) : (
                      <span className="text-sm text-foreground-muted">Non assigné</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <p className="text-sm text-foreground-muted">
                    {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

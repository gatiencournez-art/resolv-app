'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Ticket, Message, TicketStatus, User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets';
import { MessagesList, MessageComposer } from '@/components/messages';

const statusSelectOptions: SelectOption[] = [
  { value: 'NEW', label: 'Nouveau', dot: 'bg-[var(--status-new)]' },
  { value: 'IN_PROGRESS', label: 'En cours', dot: 'bg-[var(--status-progress)]' },
  { value: 'ON_HOLD', label: 'En attente', dot: 'bg-[var(--status-hold)]' },
  { value: 'RESOLVED', label: 'Résolu', dot: 'bg-[var(--status-resolved)]' },
  { value: 'CLOSED', label: 'Fermé', dot: 'bg-[var(--status-closed)]' },
];

const typeLabels: Record<string, string> = {
  SOFTWARE: 'Logiciel',
  HARDWARE: 'Matériel',
  ACCESS: 'Accès',
  ONBOARDING: 'Onboarding',
  OFFBOARDING: 'Offboarding',
  OTHER: 'Autre',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchTicket = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = (await api.getTicket(ticketId, token)) as Ticket;
      setTicket(data);
      setMessages(data.messages || []);
    } catch {
      router.push('/tickets');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, router]);

  const fetchAdmins = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isAdmin) return;

    try {
      const res = (await api.getUsers(token, { limit: '100' })) as { data: User[] };
      setAdmins((res.data || []).filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE'));
    } catch { /* ignore */ }
  }, [isAdmin]);

  useEffect(() => {
    fetchTicket();
    fetchAdmins();
    // Auto-refresh messages toutes les 10s
    const interval = setInterval(fetchTicket, 10000);
    return () => clearInterval(interval);
  }, [fetchTicket, fetchAdmins]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    const token = getAccessToken();
    if (!token || !ticket) return;

    setIsUpdating(true);
    try {
      const updated = (await api.updateTicketStatus(ticketId, newStatus, token)) as Ticket;
      setTicket({ ...ticket, status: updated.status, resolvedAt: updated.resolvedAt, closedAt: updated.closedAt });
    } catch { /* ignore */ } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (adminId: string | null) => {
    const token = getAccessToken();
    if (!token || !ticket) return;

    setIsUpdating(true);
    try {
      const updated = (await api.assignTicket(ticketId, adminId, token)) as Ticket;
      setTicket({ ...ticket, assignedAdminId: updated.assignedAdminId, assignedAdmin: updated.assignedAdmin });
    } catch { /* ignore */ } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const token = getAccessToken();
    if (!token) return;

    const newMessage = (await api.createMessage(ticketId, content, token)) as Message;
    setMessages((prev) => [...prev, newMessage]);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-7 w-96 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-40 rounded-xl" />
            <div className="skeleton h-60 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">Ticket non trouvé</p>
        <Link href="/tickets" className="text-accent hover:underline mt-2 inline-block text-sm">
          Retour aux tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/tickets"
          className="text-sm text-foreground-muted hover:text-foreground-secondary flex items-center gap-1 mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux tickets
        </Link>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-sm font-mono text-foreground-muted">{ticket.key}</span>
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-secondary whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages ({messages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MessagesList messages={messages} />
              <div className="border-t border-th-border pt-4">
                <MessageComposer onSend={handleSendMessage} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Admin actions */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <Select
                  label="Statut"
                  value={ticket.status}
                  onChange={(v) => handleStatusChange(v as TicketStatus)}
                  disabled={isUpdating}
                  options={statusSelectOptions}
                />

                {/* Assignment */}
                <Select
                  label="Assigné à"
                  value={ticket.assignedAdminId || ''}
                  onChange={(v) => handleAssign(v || null)}
                  disabled={isUpdating}
                  placeholder="Non assigné"
                  options={[
                    { value: '', label: 'Non assigné' },
                    ...admins.map((admin) => ({
                      value: admin.id,
                      label: `${admin.firstName} ${admin.lastName}`,
                      icon: (
                        <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
                          {admin.firstName[0]}{admin.lastName[0]}
                        </span>
                      ),
                    })),
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {/* Ticket info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Demandeur</p>
                <p className="text-sm text-foreground mt-1">
                  {ticket.requesterFirstName} {ticket.requesterLastName}
                </p>
                <p className="text-sm text-foreground-muted">{ticket.requesterEmail}</p>
              </div>

              {isAdmin && !ticket.assignedAdmin && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Assigné à</p>
                  <p className="text-sm text-foreground-muted mt-1 italic">Non assigné</p>
                </div>
              )}
              {isAdmin && ticket.assignedAdmin && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Assigné à</p>
                  <p className="text-sm text-foreground mt-1">
                    {ticket.assignedAdmin.firstName} {ticket.assignedAdmin.lastName}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Type</p>
                <p className="text-sm text-foreground mt-1">{typeLabels[ticket.type] || ticket.type}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Créé le</p>
                <p className="text-sm text-foreground mt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Résolu le</p>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(ticket.resolvedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {ticket.closedAt && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Fermé le</p>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(ticket.closedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

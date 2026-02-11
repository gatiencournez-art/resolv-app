'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useTicketWorkspace } from '@/contexts/ticket-workspace-context';
import { Select, ConfirmModal } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets';
import { MessagesList, MessageComposer } from '@/components/messages';
import type { TicketStatus } from '@/lib/types';

// ============================================================================
// CONSTANTS
// ============================================================================

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

const typeIcons: Record<string, string> = {
  SOFTWARE: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  HARDWARE: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  ACCESS: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
};

// ============================================================================
// METADATA FIELD
// ============================================================================

function MetadataField({ label, children, colorClass }: { label: string; children: React.ReactNode; colorClass?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl ${colorClass || 'bg-surface-tertiary/40'}`}>
      <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-[0.1em]">{label}</span>
      <div className="text-[13px] font-medium text-foreground">{children}</div>
    </div>
  );
}

// ============================================================================
// DETAIL CONTENT (shared between panel and drawer)
// ============================================================================

export function TicketDetailContent({ onClose }: { onClose: () => void }) {
  const { isAdminView } = useAuth();
  const {
    selectedTicket: ticket,
    messages,
    admins,
    isLoadingDetail,
    updateTicketStatus,
    assignTicket,
    sendMessage,
    deleteTicket,
  } = useTicketWorkspace();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!ticket) return;
    setIsDeleting(true);
    const success = await deleteTicket(ticket.id);
    setIsDeleting(false);
    if (success) {
      setShowDeleteModal(false);
      onClose();
    }
  };

  // Loading state
  if (isLoadingDetail && !ticket) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-5 py-4 border-b border-th-border flex items-center justify-between">
          <div className="skeleton h-5 w-48 rounded" />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="skeleton h-5 w-64 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Non assigné' },
    ...admins.map((admin) => ({
      value: admin.id,
      label: `${admin.firstName} ${admin.lastName}`,
      icon: (
        <span className="w-5 h-5 rounded-lg bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
          {admin.firstName[0]}{admin.lastName[0]}
        </span>
      ),
    })),
  ];

  const assigneeName = ticket.assignedAdmin
    ? `${ticket.assignedAdmin.firstName} ${ticket.assignedAdmin.lastName}`
    : 'Non assigné';

  const assigneeInitials = ticket.assignedAdmin
    ? `${ticket.assignedAdmin.firstName[0]}${ticket.assignedAdmin.lastName[0]}`
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-th-border bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-mono text-foreground-secondary bg-surface-tertiary px-2 py-0.5 rounded-md border border-th-border/60">
              {ticket.key}
            </span>
            <TicketStatusBadge status={ticket.status} size="sm" />
            <TicketPriorityBadge priority={ticket.priority} size="sm" />
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Link
              href={`/tickets/${ticket.id}`}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors group"
              title="Ouvrir en pleine page"
            >
              <svg className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors group"
            >
              <svg className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <h2 className="text-[15px] font-semibold text-foreground leading-snug">{ticket.title}</h2>
      </div>

      {/* Admin actions: status + assignment + delete */}
      {isAdminView && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-th-border bg-surface-secondary/50">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Statut"
              value={ticket.status}
              onChange={(v) => updateTicketStatus(ticket.id, v as TicketStatus)}
              options={statusSelectOptions}
            />
            <Select
              label="Assigné à"
              value={ticket.assignedAdminId || ''}
              onChange={(v) => assignTicket(ticket.id, v || null)}
              placeholder="Non assigné"
              options={assigneeOptions}
            />
          </div>
          {/* Delete button */}
          <div className="mt-3 pt-3 border-t border-th-border/40">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--priority-critical)] hover:bg-[var(--priority-critical)]/10 rounded-xl transition-all duration-150 w-full justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer ce ticket
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le ticket"
        message="Cette action est irréversible. Toutes les données associées à ce ticket seront définitivement supprimées."
        detail={`${ticket.key} - ${ticket.title}`}
        confirmLabel={isDeleting ? 'Suppression...' : 'Supprimer'}
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Metadata grid */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-th-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <MetadataField label="Type" colorClass="bg-indigo-500/[0.07]">
            <span className="inline-flex items-center gap-1.5">
              {typeIcons[ticket.type] && (
                <svg className="w-3.5 h-3.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[ticket.type]} />
                </svg>
              )}
              {typeLabels[ticket.type] || ticket.type}
            </span>
          </MetadataField>

          <MetadataField label="Demandeur" colorClass="bg-blue-500/[0.07]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-blue-500/15 flex items-center justify-center text-[7px] font-bold text-blue-400 flex-shrink-0">
                {ticket.requesterFirstName[0]}{ticket.requesterLastName[0]}
              </span>
              {ticket.requesterFirstName} {ticket.requesterLastName}
            </span>
          </MetadataField>

          {isAdminView && (
            <MetadataField label="Assigné" colorClass="bg-emerald-500/[0.07]">
              <span className="inline-flex items-center gap-1.5">
                {assigneeInitials ? (
                  <span className="w-4 h-4 rounded-md bg-emerald-500/15 flex items-center justify-center text-[7px] font-bold text-emerald-400 flex-shrink-0">
                    {assigneeInitials}
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                )}
                <span className={!assigneeInitials ? 'text-foreground-muted' : ''}>
                  {assigneeName}
                </span>
              </span>
            </MetadataField>
          )}

          <MetadataField label="Créé le" colorClass="bg-amber-500/[0.07]">
            {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </MetadataField>

          {ticket.resolvedAt && (
            <MetadataField label="Résolu le" colorClass="bg-green-500/[0.07]">
              <span className="text-[var(--status-resolved)]">
                {new Date(ticket.resolvedAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </MetadataField>
          )}
        </div>
      </div>

      {/* Scrollable area: description + messages */}
      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        <div className="px-5 py-4 border-b border-th-border">
          <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.14em] mb-2.5">
            Description
          </h3>
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-th-border/60">
            <p className="text-[13px] text-foreground-secondary whitespace-pre-wrap leading-relaxed">
              {ticket.description || 'Aucune description'}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="px-5 py-4 border-b border-th-border">
            <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.14em] mb-2.5">
              Pièces jointes
              <span className="ml-2 text-[10px] font-semibold text-foreground-muted/60">{ticket.attachments.length}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ticket.attachments.map((att) => {
                const isImage = att.mimeType.startsWith('image/');
                const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
                return (
                  <a
                    key={att.id}
                    href={`${apiBase}${att.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-secondary border border-th-border/50 hover:border-accent/30 hover:bg-accent/[0.03] transition-all group"
                  >
                    {isImage ? (
                      <img src={`${apiBase}${att.url}`} alt={att.filename} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{att.filename}</p>
                      <p className="text-[10px] text-foreground-muted">{(att.size / 1024).toFixed(1)} Ko</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="px-5 py-4">
          <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.14em] mb-3">
            Messages
            {messages.length > 0 && (
              <span className="ml-2 text-[10px] font-semibold text-foreground-muted/60 tabular-nums">
                {messages.length}
              </span>
            )}
          </h3>
          <MessagesList messages={messages} />
        </div>
      </div>

      {/* Composer (sticky bottom) */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-th-border bg-surface/90 backdrop-blur-sm">
        <MessageComposer onSend={sendMessage} />
      </div>
    </div>
  );
}

// ============================================================================
// PANEL WRAPPER (right column on desktop)
// ============================================================================

export function TicketDetailPanel({ className = '' }: { className?: string }) {
  const { selectedTicketId, selectTicket } = useTicketWorkspace();

  if (!selectedTicketId) {
    return (
      <div className={`w-[480px] flex-shrink-0 border-l border-th-border bg-surface flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-surface-tertiary border border-th-border flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-foreground-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground-secondary">Sélectionnez un ticket</p>
          <p className="text-xs text-foreground-muted mt-1.5">Cliquez sur un ticket pour voir les détails et les messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-[480px] flex-shrink-0 border-l border-th-border bg-surface ${className}`}>
      <TicketDetailContent onClose={() => selectTicket(null)} />
    </div>
  );
}

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

function MetadataField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-secondary/40 dark:bg-white/[0.02] border border-th-border/30 dark:border-white/[0.04]">
      <span className="text-[10px] font-semibold text-foreground-muted/70 uppercase tracking-wider">{label}</span>
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
        <div className="flex-shrink-0 px-5 py-4 border-b border-th-border/60 dark:border-white/[0.06] flex items-center justify-between">
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
        <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
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
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-th-border/60 dark:border-white/[0.06]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-mono text-foreground-muted bg-surface-tertiary/80 px-1.5 py-0.5 rounded-md">{ticket.key}</span>
            <TicketStatusBadge status={ticket.status} size="sm" />
            <TicketPriorityBadge priority={ticket.priority} size="sm" />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href={`/tickets/${ticket.id}`}
              className="p-1.5 rounded-xl hover:bg-surface-hover dark:hover:bg-white/[0.06] transition-colors group"
              title="Ouvrir en pleine page"
            >
              <svg className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-surface-hover dark:hover:bg-white/[0.06] transition-colors group"
            >
              <svg className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <h2 className="text-base font-semibold text-foreground leading-snug">{ticket.title}</h2>
      </div>

      {/* Admin actions: status + assignment + delete */}
      {isAdminView && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-th-border/60 dark:border-white/[0.06] bg-surface-secondary/30 dark:bg-white/[0.015]">
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
          <div className="mt-3 pt-3 border-t border-th-border/30 dark:border-white/[0.04]">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--priority-critical)] hover:bg-[var(--priority-critical)]/10 rounded-xl transition-colors w-full justify-center"
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
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-th-border/60 dark:border-white/[0.06]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <MetadataField label="Type">
            <span className="inline-flex items-center gap-1.5">
              {typeIcons[ticket.type] && (
                <svg className="w-3.5 h-3.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[ticket.type]} />
                </svg>
              )}
              {typeLabels[ticket.type] || ticket.type}
            </span>
          </MetadataField>

          <MetadataField label="Demandeur">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-surface-tertiary flex items-center justify-center text-[7px] font-bold text-foreground-muted flex-shrink-0">
                {ticket.requesterFirstName[0]}{ticket.requesterLastName[0]}
              </span>
              {ticket.requesterFirstName} {ticket.requesterLastName}
            </span>
          </MetadataField>

          {isAdminView && (
            <MetadataField label="Assigné">
              <span className="inline-flex items-center gap-1.5">
                {assigneeInitials ? (
                  <span className="w-4 h-4 rounded-full bg-accent/15 flex items-center justify-center text-[7px] font-bold text-accent flex-shrink-0">
                    {assigneeInitials}
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-foreground-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <MetadataField label="Créé le">
            {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </MetadataField>

          {ticket.resolvedAt && (
            <MetadataField label="Résolu le">
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
        <div className="px-5 py-4 border-b border-th-border/60 dark:border-white/[0.06]">
          <h3 className="text-[10px] font-bold text-foreground-muted/70 uppercase tracking-[0.1em] mb-2.5">
            Description
          </h3>
          <p className="text-[13px] text-foreground-secondary whitespace-pre-wrap leading-relaxed">
            {ticket.description || 'Aucune description'}
          </p>
        </div>

        {/* Messages */}
        <div className="px-5 py-4">
          <h3 className="text-[10px] font-bold text-foreground-muted/70 uppercase tracking-[0.1em] mb-3">
            Messages
            <span className="ml-1.5 text-foreground-muted/50 font-semibold normal-case">({messages.length})</span>
          </h3>
          <MessagesList messages={messages} />
        </div>
      </div>

      {/* Composer (sticky bottom) */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-th-border/60 dark:border-white/[0.06] bg-surface">
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
      <div className={`w-[480px] flex-shrink-0 border-l border-th-border/60 dark:border-white/[0.06] bg-surface flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-surface-tertiary/60 dark:bg-white/[0.04] border border-th-border/20 dark:border-white/[0.04] flex items-center justify-center mb-4">
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
    <div className={`w-[480px] flex-shrink-0 border-l border-th-border/60 dark:border-white/[0.06] bg-surface ${className}`}>
      <TicketDetailContent onClose={() => selectTicket(null)} />
    </div>
  );
}

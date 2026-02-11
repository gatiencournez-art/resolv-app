'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { User } from '@/lib/types';
import { UsersTable } from '@/components/users';
import { ConfirmModal } from '@/components/ui';

type Tab = 'all' | 'pending' | 'rejected' | 'suspended';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Utilisateurs' },
  { key: 'pending', label: 'En attente' },
  { key: 'rejected', label: 'Refusés' },
  { key: 'suspended', label: 'Suspendus' },
];

export default function UsersPage() {
  const router = useRouter();
  const { user, isAdminView } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', variant: 'default', confirmLabel: '', onConfirm: () => {} });

  useEffect(() => {
    if (user && !isAdminView) router.push('/');
  }, [user, isAdminView, router]);

  const fetchUsers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = (await api.getUsers(token, { limit: '100' })) as { data: User[] };
      setUsers(res.data || []);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAdminView) return;
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [isAdminView, fetchUsers]);

  const handleApprove = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Approuver l\'utilisateur',
      message: `Voulez-vous approuver ${target?.firstName} ${target?.lastName} ?`,
      detail: 'L\'utilisateur pourra accéder à la plateforme et créer des tickets.',
      variant: 'default',
      confirmLabel: 'Approuver',
      onConfirm: async () => {
        const token = getAccessToken();
        if (!token) return;
        try { await api.approveUser(userId, token); fetchUsers(); } catch { /* ignore */ }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReject = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Refuser l\'utilisateur',
      message: `Voulez-vous refuser ${target?.firstName} ${target?.lastName} ?`,
      detail: 'L\'utilisateur recevra un message de demande non approuvée mais pourra réessayer de rejoindre l\'organisation.',
      variant: 'danger',
      confirmLabel: 'Refuser',
      onConfirm: async () => {
        const token = getAccessToken();
        if (!token) return;
        try { await api.updateUserStatus(userId, 'REJECTED', token); fetchUsers(); } catch { /* ignore */ }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSuspend = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Suspendre l\'utilisateur',
      message: `Voulez-vous suspendre ${target?.firstName} ${target?.lastName} ?`,
      detail: 'L\'utilisateur ne pourra plus se connecter ni accéder à la plateforme.',
      variant: 'danger',
      confirmLabel: 'Suspendre',
      onConfirm: async () => {
        const token = getAccessToken();
        if (!token) return;
        try { await api.updateUserStatus(userId, 'SUSPENDED', token); fetchUsers(); } catch { /* ignore */ }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReactivate = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Réactiver l\'utilisateur',
      message: `Voulez-vous réactiver ${target?.firstName} ${target?.lastName} ?`,
      detail: 'L\'utilisateur pourra à nouveau se connecter et accéder à la plateforme.',
      variant: 'default',
      confirmLabel: 'Réactiver',
      onConfirm: async () => {
        const token = getAccessToken();
        if (!token) return;
        try { await api.updateUserStatus(userId, 'ACTIVE', token); fetchUsers(); } catch { /* ignore */ }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleChangeRole = (userId: string, role: 'ADMIN' | 'USER') => {
    const target = users.find((u) => u.id === userId);
    const roleLabel = role === 'ADMIN' ? 'Administrateur' : 'Utilisateur';
    setConfirmModal({
      isOpen: true,
      title: 'Changer le rôle',
      message: `Changer le rôle de ${target?.firstName} ${target?.lastName} en "${roleLabel}" ?`,
      detail: role === 'ADMIN'
        ? 'L\'utilisateur aura accès à toutes les fonctionnalités d\'administration.'
        : 'L\'utilisateur perdra ses droits d\'administration.',
      variant: 'warning',
      confirmLabel: 'Confirmer',
      onConfirm: async () => {
        const token = getAccessToken();
        if (!token) return;
        try { await api.updateUserRole(userId, role, token); fetchUsers(); } catch { /* ignore */ }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (!isAdminView) return null;

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const rejectedUsers = users.filter((u) => u.status === 'REJECTED');
  const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED');
  const activeUsers = users.filter((u) => u.status === 'ACTIVE' || u.status === 'PENDING');

  const filteredUsers = tab === 'pending' ? pendingUsers
    : tab === 'rejected' ? rejectedUsers
    : tab === 'suspended' ? suspendedUsers
    : activeUsers;

  // Sort: admins first, then alphabetical by last name
  const sortedUsers = useMemo(() =>
    [...filteredUsers].sort((a, b) => {
      if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
      if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
      return a.lastName.localeCompare(b.lastName, 'fr');
    }),
    [filteredUsers]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Gestion des utilisateurs</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Attribuez les rôles et gérez les accès</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-th-border/60 dark:border-white/[0.06]">
        {TABS.map((t) => {
          const count =
            t.key === 'pending' ? pendingUsers.length
            : t.key === 'rejected' ? rejectedUsers.length
            : t.key === 'suspended' ? suspendedUsers.length
            : activeUsers.length;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`
                relative px-4 py-2.5 text-sm font-medium transition-colors
                ${tab === t.key
                  ? 'text-accent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full'
                  : 'text-foreground-muted hover:text-foreground-secondary'
                }
              `}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full ${
                  t.key === 'pending' && count > 0
                    ? 'bg-[var(--status-progress-bg)] text-[var(--status-progress)]'
                    : 'bg-surface-tertiary text-foreground-muted'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pending alert */}
      {tab === 'all' && pendingUsers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--status-progress-bg)] border border-[var(--status-progress)]/30">
          <svg className="w-5 h-5 text-[var(--status-progress)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-[var(--status-progress)]">
            <span className="font-medium">{pendingUsers.length} utilisateur{pendingUsers.length > 1 ? 's' : ''}</span> en attente de validation.{' '}
            <button onClick={() => setTab('pending')} className="underline hover:no-underline font-medium">
              Voir
            </button>
          </p>
        </div>
      )}

      {/* Table */}
      <UsersTable
        users={sortedUsers}
        isLoading={isLoading}
        onApprove={tab === 'pending' || tab === 'all' ? handleApprove : undefined}
        onReject={tab === 'pending' || tab === 'all' ? handleReject : undefined}
        onSuspend={handleSuspend}
        onReactivate={handleReactivate}
        onChangeRole={handleChangeRole}
        currentUserId={user?.id}
      />

      {sortedUsers.length === 0 && !isLoading && (
        <div className="text-center py-12 text-foreground-muted text-sm">
          {tab === 'pending' ? 'Aucun utilisateur en attente' :
           tab === 'rejected' ? 'Aucun utilisateur refusé' :
           tab === 'suspended' ? 'Aucun utilisateur suspendu' :
           'Aucun utilisateur'}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        detail={confirmModal.detail}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

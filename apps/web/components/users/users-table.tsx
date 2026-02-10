'use client';

import { User } from '@/lib/types';
import { UserStatusBadge } from './user-status-badge';
import { Button } from '@/components/ui';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onApprove?: (userId: string) => void;
  onReject?: (userId: string) => void;
  onSuspend?: (userId: string) => void;
  onReactivate?: (userId: string) => void;
  onChangeRole?: (userId: string, role: 'ADMIN' | 'USER') => void;
  currentUserId?: string;
}

function RoleToggle({
  role,
  onChange,
  disabled
}: {
  role: 'ADMIN' | 'USER';
  onChange: (role: 'ADMIN' | 'USER') => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-xl p-0.5 bg-surface-tertiary/50 dark:bg-white/[0.04] border border-th-border/40 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => !disabled && role !== 'USER' && onChange('USER')}
        disabled={disabled}
        className={`
          relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
          ${role === 'USER'
            ? 'bg-surface dark:bg-white/[0.08] text-foreground shadow-sm'
            : 'text-foreground-muted hover:text-foreground-secondary'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        Utilisateur
      </button>
      <button
        type="button"
        onClick={() => !disabled && role !== 'ADMIN' && onChange('ADMIN')}
        disabled={disabled}
        className={`
          relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
          ${role === 'ADMIN'
            ? 'bg-accent/15 text-accent shadow-sm'
            : 'text-foreground-muted hover:text-foreground-secondary'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        Admin
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${isAdmin
          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          : 'bg-white/[0.04] dark:bg-white/[0.04] bg-surface-tertiary text-foreground-muted border border-white/[0.08] dark:border-white/[0.08] border-[var(--border)]'
        }
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-400' : 'bg-foreground-muted/50'}`} />
      {isAdmin ? 'Admin' : 'Utilisateur'}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-th-border/60 dark:border-white/[0.06] overflow-hidden">
      <div className="px-4 py-3 bg-surface-tertiary/50 dark:bg-white/[0.02]">
        <div className="skeleton h-4 w-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-t border-th-border/40 dark:border-white/[0.04] flex items-center gap-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-40" />
            </div>
          </div>
          <div className="skeleton h-7 w-24 rounded-lg" />
          <div className="skeleton h-5 w-16 rounded-md" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function UsersTable({
  users, isLoading, onApprove, onReject, onSuspend, onReactivate, onChangeRole, currentUserId,
}: UsersTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-th-border/60 dark:border-white/[0.06]">
        <div className="p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="mt-3 text-sm text-foreground-muted">Aucun utilisateur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-th-border/60 dark:border-white/[0.06] overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-th-border/60 dark:divide-white/[0.06]">
          <thead>
            <tr className="bg-surface-tertiary/50 dark:bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Inscrit le</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border/40 dark:divide-white/[0.04]">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const canChangeRole = !isSelf && user.status === 'ACTIVE';

              return (
                <tr key={user.id} className="hover:bg-surface-hover dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-surface-tertiary/80 dark:bg-white/[0.04] rounded-full flex items-center justify-center text-sm font-medium text-foreground-secondary ring-2 ring-white/5">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.firstName} {user.lastName}
                          {isSelf && <span className="ml-2 text-xs text-foreground-muted">(vous)</span>}
                        </p>
                        <p className="text-xs text-foreground-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {canChangeRole ? (
                      <RoleToggle
                        role={user.role as 'ADMIN' | 'USER'}
                        onChange={(newRole) => onChangeRole?.(user.id, newRole)}
                      />
                    ) : (
                      <RoleBadge role={user.role} />
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-foreground-muted">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onReject?.(user.id)}>Refuser</Button>
                          <Button size="sm" variant="primary" onClick={() => onApprove?.(user.id)}>Approuver</Button>
                        </>
                      )}
                      {user.status === 'ACTIVE' && !isSelf && (
                        <Button size="sm" variant="outline" onClick={() => onSuspend?.(user.id)}>Suspendre</Button>
                      )}
                      {(user.status === 'SUSPENDED' || user.status === 'REJECTED') && (
                        <Button size="sm" variant="outline" onClick={() => onReactivate?.(user.id)}>Réactiver</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

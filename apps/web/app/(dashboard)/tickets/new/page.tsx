'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth';
import { Ticket, TicketPriority } from '@/lib/types';
import { Button, Input, Card, CardContent, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';

interface TicketCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const FALLBACK_TYPE_OPTIONS: SelectOption[] = [
  { value: 'SOFTWARE', label: 'Logiciel', dot: 'bg-indigo-500' },
  { value: 'HARDWARE', label: 'Matériel', dot: 'bg-amber-500' },
  { value: 'ACCESS', label: 'Accès', dot: 'bg-emerald-500' },
  { value: 'ONBOARDING', label: 'Onboarding', dot: 'bg-blue-500' },
  { value: 'OFFBOARDING', label: 'Offboarding', dot: 'bg-violet-500' },
  { value: 'OTHER', label: 'Autre', dot: 'bg-slate-400' },
];

const priorityOptions: SelectOption[] = [
  { value: 'LOW', label: 'Basse', dot: 'bg-slate-400' },
  { value: 'MEDIUM', label: 'Moyenne', dot: 'bg-amber-500' },
  { value: 'HIGH', label: 'Haute', dot: 'bg-orange-500' },
  { value: 'CRITICAL', label: 'Critique', dot: 'bg-red-500' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic data
  const [typeOptions, setTypeOptions] = useState<SelectOption[]>(FALLBACK_TYPE_OPTIONS);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'OTHER',
    priority: 'MEDIUM' as TicketPriority,
    requesterFirstName: user?.firstName || '',
    requesterLastName: user?.lastName || '',
    requesterEmail: user?.email || '',
    assignedAdminId: '',
  });

  // Fetch categories and admins on mount
  const fetchData = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    try {
      const cats = await api.getTicketCategories(token) as TicketCategory[];
      if (cats.length > 0) {
        setTypeOptions(
          cats
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.name, label: c.name }))
        );
        setFormData((prev) => ({ ...prev, type: cats[0].name }));
      }
    } catch { /* fallback to hardcoded options */ }

    if (isAdmin) {
      try {
        const res = (await api.getUsers(token, { limit: '100' })) as { data: AdminUser[] };
        setAdmins((res.data || []).filter((u) => u.role === 'ADMIN'));
      } catch { /* ignore */ }
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    // Filter out files > 10MB
    const valid = arr.filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getValidAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        requesterFirstName: formData.requesterFirstName,
        requesterLastName: formData.requesterLastName,
        requesterEmail: formData.requesterEmail,
      };
      if (formData.assignedAdminId) {
        payload.assignedAdminId = formData.assignedAdminId;
      }
      const ticket = (await api.createTicket(payload, token)) as Ticket;

      // Upload attachments
      for (const file of files) {
        try {
          await api.uploadAttachment(ticket.id, file, token);
        } catch { /* continue even if one fails */ }
      }

      router.push(`/tickets/${ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tickets"
          className="text-sm text-foreground-muted hover:text-foreground-secondary flex items-center gap-1 mb-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux tickets
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Nouveau ticket</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Décrivez votre problème ou votre demande</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Title */}
            <Input
              label="Titre"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Résumez votre demande en quelques mots"
              required
            />

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(val) => handleSelectChange('type', val)}
                options={typeOptions}
              />
              <Select
                label="Priorité"
                value={formData.priority}
                onChange={(val) => handleSelectChange('priority', val)}
                options={priorityOptions}
              />
            </div>

            {/* Assign to admin (admin only) */}
            {isAdmin && admins.length > 0 && (
              <Select
                label="Assigné à"
                value={formData.assignedAdminId}
                onChange={(val) => handleSelectChange('assignedAdminId', val)}
                options={[
                  { value: '', label: 'Non assigné' },
                  ...admins.map((a) => ({
                    value: a.id,
                    label: `${a.firstName} ${a.lastName}`,
                  })),
                ]}
              />
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre problème en détail..."
                rows={5}
                required
                className="w-full px-3 py-2.5 text-sm border border-th-border rounded-lg bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors resize-none"
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Pièces jointes
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`
                  flex flex-col items-center justify-center gap-2 w-full px-4 py-5 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-all duration-150
                  ${dragOver
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-th-border/60 text-foreground-muted hover:border-accent/40 hover:text-accent hover:bg-accent/[0.02]'
                  }
                `}
              >
                <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                <span className="font-medium">Glissez des fichiers ici ou cliquez pour parcourir</span>
                <span className="text-xs text-foreground-muted/60">Images, PDF, documents — 10 Mo max par fichier</span>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-secondary border border-th-border/50"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-[11px] text-foreground-muted">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requester info */}
            <div className="border-t border-th-border pt-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Informations du demandeur</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  name="requesterFirstName"
                  value={formData.requesterFirstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Nom"
                  name="requesterLastName"
                  value={formData.requesterLastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Email"
                  name="requesterEmail"
                  type="email"
                  value={formData.requesterEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/tickets">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                Créer le ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

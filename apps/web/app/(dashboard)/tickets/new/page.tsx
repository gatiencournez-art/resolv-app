'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Ticket, TicketType, TicketPriority } from '@/lib/types';
import { Button, Input, Card, CardContent, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';

const typeOptions: SelectOption[] = [
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

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'OTHER' as TicketType,
    priority: 'MEDIUM' as TicketPriority,
    requesterFirstName: user?.firstName || '',
    requesterLastName: user?.lastName || '',
    requesterEmail: user?.email || '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    setError('');

    try {
      const ticket = (await api.createTicket(formData, token)) as Ticket;
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

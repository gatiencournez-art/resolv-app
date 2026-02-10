'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Ticket, TicketStatus } from '@/lib/types';

// ============================================================================
// ICONS
// ============================================================================

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ComputerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ============================================================================
// GLASS CARD
// ============================================================================

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] dark:bg-white/[0.03] bg-[var(--surface)]/80
        backdrop-blur-xl
        border border-white/[0.08] dark:border-white/[0.08] border-[var(--border)]
        shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============================================================================
// FAQ DATA
// ============================================================================

const FAQ_ITEMS = [
  {
    q: 'Comment créer un nouveau ticket ?',
    a: 'Cliquez sur "Nouveau ticket" dans le menu de gauche, remplissez le formulaire avec un titre, une description et le type de demande, puis soumettez.',
  },
  {
    q: 'Combien de temps pour obtenir une réponse ?',
    a: 'Le temps de réponse dépend de la priorité de votre ticket. Les tickets critiques sont traités en priorité, généralement sous 1h.',
  },
  {
    q: 'Comment suivre l\'avancement de mon ticket ?',
    a: 'Rendez-vous dans "Mes tickets" pour voir le statut de chaque demande. Vous pouvez aussi consulter les messages échangés avec le support.',
  },
  {
    q: 'Puis-je modifier un ticket déjà envoyé ?',
    a: 'Vous ne pouvez pas modifier un ticket après envoi, mais vous pouvez ajouter un message pour préciser ou corriger des informations.',
  },
  {
    q: 'Comment contacter directement le support ?',
    a: 'Utilisez le système de messagerie dans chaque ticket pour communiquer avec l\'équipe support. Les messages sont reçus en temps réel.',
  },
];

// ============================================================================
// CATEGORIES
// ============================================================================

const CATEGORIES = [
  {
    name: 'Premiers pas',
    description: 'Démarrer avec la plateforme',
    icon: <RocketIcon />,
    color: 'bg-indigo-500/15 text-indigo-400',
    borderHover: 'hover:border-indigo-500/30',
  },
  {
    name: 'Matériel',
    description: 'Ordinateurs, imprimantes, téléphones',
    icon: <ComputerIcon />,
    color: 'bg-amber-500/15 text-amber-400',
    borderHover: 'hover:border-amber-500/30',
  },
  {
    name: 'Logiciels',
    description: 'Applications, licences, installations',
    icon: <CodeIcon />,
    color: 'bg-violet-500/15 text-violet-400',
    borderHover: 'hover:border-violet-500/30',
  },
  {
    name: 'Réseau',
    description: 'Wi-Fi, VPN, connexions internet',
    icon: <WifiIcon />,
    color: 'bg-emerald-500/15 text-emerald-400',
    borderHover: 'hover:border-emerald-500/30',
  },
  {
    name: 'Accès & Sécurité',
    description: 'Mots de passe, permissions, comptes',
    icon: <LockIcon />,
    color: 'bg-rose-500/15 text-rose-400',
    borderHover: 'hover:border-rose-500/30',
  },
  {
    name: 'Onboarding',
    description: 'Configuration nouveau collaborateur',
    icon: <UsersIcon />,
    color: 'bg-teal-500/15 text-teal-400',
    borderHover: 'hover:border-teal-500/30',
  },
];

// ============================================================================
// HELP CENTER PAGE
// ============================================================================

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const statusDot: Record<TicketStatus, string> = {
  NEW: 'bg-indigo-400',
  IN_PROGRESS: 'bg-amber-400',
  ON_HOLD: 'bg-zinc-400',
  RESOLVED: 'bg-emerald-400',
  CLOSED: 'bg-zinc-600',
};

export default function HelpPage() {
  const { isAdminView } = useAuth();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = (await api.getTickets(token, { limit: '5' })) as { data: Ticket[] };
      setTickets(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredFaq = useMemo(() => {
    if (!search.trim()) return FAQ_ITEMS;
    const s = search.toLowerCase();
    return FAQ_ITEMS.filter(
      (f) => f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s)
    );
  }, [search]);

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [tickets]
  );

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto relative">
      {/* Ambient glows */}
      <div className="fixed top-0 left-60 right-0 bottom-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[30%] w-[500px] h-[500px] bg-indigo-500/[0.06] dark:bg-indigo-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[15%] w-[400px] h-[400px] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-foreground">Centre d&apos;aide</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Comment pouvons-nous vous aider aujourd&apos;hui ?
        </p>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-2">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-transparent text-foreground placeholder:text-foreground-muted focus:outline-none"
          />
        </div>
      </GlassCard>

      {/* Categories Grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Catégories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <GlassCard
              key={cat.name}
              className={`p-5 cursor-pointer transition-all duration-200 ${cat.borderHover} hover:shadow-lg group`}
            >
              <div className={`w-11 h-11 rounded-xl ${cat.color} flex items-center justify-center mb-3`}>
                {cat.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-foreground-muted mt-1">{cat.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Questions fréquentes</h2>
        <GlassCard className="divide-y divide-white/[0.06] dark:divide-white/[0.06] divide-[var(--border)]">
          {filteredFaq.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-foreground-muted text-sm">Aucun résultat pour &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            filteredFaq.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-foreground-muted flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-foreground-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </GlassCard>
      </div>

      {/* Recent Tickets */}
      {!isAdminView && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Vos tickets récents</h2>
            <Link
              href="/tickets"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Voir tout
              <ArrowRightIcon />
            </Link>
          </div>
          <GlassCard className="p-1">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-foreground-muted text-sm">Aucun ticket récent</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${statusDot[t.status]} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-medium truncate block">{t.title}</span>
                      <span className="text-xs text-foreground-muted">{STATUS_LABELS[t.status]}</span>
                    </div>
                    <span className="text-xs text-foreground-muted">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Contact Support Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
            <span className="text-accent"><ChatIcon /></span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-foreground">Besoin d&apos;aide supplémentaire ?</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Notre équipe support est disponible pour vous aider
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">En ligne</span>
            </div>
            <Link
              href="/tickets/new"
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shadow-lg shadow-accent/20"
            >
              Contacter le support
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme, PRESET_THEMES, type ColorTheme } from '@/contexts/theme-context';
import { useLanguage, type Language } from '@/contexts/language-context';
import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth';
import { Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

type SettingsTab = 'profile' | 'theme' | 'preferences' | 'security' | 'system';

interface SlaPolicy {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  responseTime: number;
  resolutionTime: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Normale',
  LOW: 'Basse',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const DEFAULT_SLA: Record<string, { responseTime: number; resolutionTime: number }> = {
  CRITICAL: { responseTime: 30, resolutionTime: 240 },
  HIGH: { responseTime: 120, resolutionTime: 1440 },
  MEDIUM: { responseTime: 480, resolutionTime: 4320 },
  LOW: { responseTime: 1440, resolutionTime: 10080 },
};

const TICKET_TYPES = [
  { id: 'SOFTWARE', label: 'Logiciel', color: '#6366f1' },
  { id: 'HARDWARE', label: 'Matériel', color: '#f97316' },
  { id: 'ACCESS', label: 'Accès', color: '#10b981' },
  { id: 'ONBOARDING', label: 'Intégration', color: '#3b82f6' },
  { id: 'OFFBOARDING', label: 'Départ', color: '#ef4444' },
  { id: 'OTHER', label: 'Autre', color: '#8b8b96' },
];

// ============================================================================
// ICONS
// ============================================================================

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-6-6H7m4-2V3m0 0h4m-4 0H7" />
    </svg>
  );
}

function SwatchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
        bg-surface-secondary/80 backdrop-blur-xl
        border border-th-border
        shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============================================================================
// TOGGLE SWITCH
// ============================================================================

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${enabled ? 'bg-accent' : 'bg-foreground-muted/30'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// ============================================================================
// INPUT FIELD
// ============================================================================

function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange || disabled}
        placeholder={placeholder}
        className={`
          w-full h-10 px-4 text-sm rounded-xl border transition-colors
          bg-surface-secondary
          border-th-border
          text-foreground placeholder:text-foreground-muted
          focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
          ${disabled || !onChange ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
}

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

const languageOptions: SelectOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

// ============================================================================
// TABS CONFIG
// ============================================================================

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { key: 'profile', label: 'Profil', icon: <UserIcon /> },
  { key: 'theme', label: 'Thème', icon: <SwatchIcon /> },
  { key: 'preferences', label: 'Préférences', icon: <PaletteIcon /> },
  { key: 'security', label: 'Sécurité', icon: <ShieldIcon /> },
  { key: 'system', label: 'Système', icon: <GearIcon />, adminOnly: true },
];

// ============================================================================
// ORG ADVANCED INFO (Admin only)
// ============================================================================

function OrgAdvancedInfo({ organizationId }: { organizationId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organizationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className="mt-5 pt-5 border-t border-th-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-foreground-muted hover:text-foreground-secondary transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Informations avancées
      </button>

      {isOpen && (
        <div className="mt-3 p-4 rounded-xl bg-surface-tertiary border border-th-border/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider mb-1">
                Identifiant interne
              </p>
              <p className="text-xs text-foreground-secondary font-mono truncate">
                {organizationId}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-surface-hover hover:bg-surface-inset border border-th-border text-foreground-muted hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span className="text-emerald-500 dark:text-emerald-400">Copié</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-foreground-muted mt-2">
            Utilisé pour le support et les intégrations
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// THEME MODE CARD
// ============================================================================

function ThemeModeCard({
  mode,
  label,
  isActive,
  onClick,
  icon,
}: {
  mode: 'light' | 'dark';
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 group
        ${isActive
          ? 'border-accent bg-accent/[0.06] shadow-[0_0_24px_rgba(99,102,241,0.08)]'
          : 'border-th-border hover:border-th-border-secondary bg-surface-secondary hover:bg-surface-hover'
        }
      `}
    >
      {/* Preview mockup */}
      <div className={`
        w-full h-20 rounded-xl overflow-hidden flex transition-transform duration-200 group-hover:scale-[1.02]
        ${mode === 'dark'
          ? 'bg-[#0d0d14] border border-white/[0.08]'
          : 'bg-white border border-gray-200/80'
        }
      `}>
        {/* Sidebar preview */}
        <div className={`w-8 h-full ${mode === 'dark' ? 'bg-[#0a0a10]' : 'bg-gray-50'} flex flex-col items-center py-2 gap-1.5`}>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--accent)', opacity: 0.6 }} />
          <div className={`w-3 h-1 rounded-full ${mode === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`w-3 h-1 rounded-full ${mode === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
        </div>
        {/* Content preview */}
        <div className="flex-1 p-2 flex flex-col gap-1">
          <div className={`w-12 h-1.5 rounded-full ${mode === 'dark' ? 'bg-white/15' : 'bg-gray-200'}`} />
          <div className={`w-full h-1 rounded-full ${mode === 'dark' ? 'bg-white/8' : 'bg-gray-100'}`} />
          <div className={`w-3/4 h-1 rounded-full ${mode === 'dark' ? 'bg-white/8' : 'bg-gray-100'}`} />
          <div className="flex-1" />
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded" style={{ backgroundColor: 'var(--accent)', opacity: 0.5 }} />
            <div className={`w-6 h-3 rounded ${mode === 'dark' ? 'bg-white/8' : 'bg-gray-100'}`} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className={isActive ? 'text-accent' : 'text-foreground-muted'}>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// COLOR PALETTE CARD
// ============================================================================

function PaletteCard({
  theme,
  isActive,
  onClick,
}: {
  theme: ColorTheme;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 group text-left
        ${isActive
          ? 'border-accent bg-accent/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.06)]'
          : 'border-th-border hover:border-th-border-secondary bg-surface-secondary hover:bg-surface-hover'
        }
      `}
    >
      {/* Color dots */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full shadow-sm ring-2 ring-white/10"
          style={{ backgroundColor: theme.accent }}
        />
        <div
          className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white/10"
          style={{ backgroundColor: theme.secondary }}
        />
      </div>

      {/* Name */}
      <span className="text-xs font-semibold text-foreground">{theme.name}</span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <CheckIcon className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// SLA MANAGEMENT
// ============================================================================

function SlaManagement() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ responseTime: 0, resolutionTime: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;
    try {
      const data = await api.getSlaPolicies(token) as SlaPolicy[];
      setPolicies(data);
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleEdit = (policy: SlaPolicy) => {
    setEditingId(policy.id);
    setEditValues({
      responseTime: policy.responseTime,
      resolutionTime: policy.resolutionTime,
    });
  };

  const handleSave = async (policy: SlaPolicy) => {
    const token = await getValidAccessToken();
    if (!token) return;
    setIsSaving(true);
    try {
      await api.updateSlaPolicy(policy.id, editValues, token);
      await fetchPolicies();
      setEditingId(null);
      setSavedId(policy.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  const handleCreate = async (priority: string) => {
    const token = await getValidAccessToken();
    if (!token) return;
    const defaults = DEFAULT_SLA[priority];
    try {
      await api.createSlaPolicy({ priority, ...defaults }, token);
      await fetchPolicies();
    } catch { /* ignore */ }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}j ${remHours}h` : `${days}j`;
  };

  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {priorities.map((priority) => {
        const policy = policies.find(p => p.priority === priority);
        const isEditing = editingId === policy?.id;
        const isSaved = savedId === policy?.id;

        return (
          <div
            key={priority}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface-tertiary border border-th-border/50 transition-colors"
          >
            {/* Priority badge */}
            <div className="flex items-center gap-2.5 w-28 flex-shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[priority] }}
              />
              <span className="text-sm font-medium text-foreground">
                {PRIORITY_LABELS[priority]}
              </span>
            </div>

            {policy ? (
              isEditing ? (
                <>
                  {/* Editing mode */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-foreground-muted">Réponse</span>
                      <input
                        type="number"
                        value={editValues.responseTime}
                        onChange={(e) => setEditValues(v => ({ ...v, responseTime: parseInt(e.target.value) || 0 }))}
                        className="w-20 h-8 px-2 text-xs text-center rounded-lg bg-surface-secondary border border-th-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <span className="text-[11px] text-foreground-muted">min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-foreground-muted">Résolution</span>
                      <input
                        type="number"
                        value={editValues.resolutionTime}
                        onChange={(e) => setEditValues(v => ({ ...v, resolutionTime: parseInt(e.target.value) || 0 }))}
                        className="w-20 h-8 px-2 text-xs text-center rounded-lg bg-surface-secondary border border-th-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <span className="text-[11px] text-foreground-muted">min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(policy)}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                    >
                      {isSaving ? '...' : 'OK'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover border border-th-border text-foreground-muted hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Display mode */}
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-foreground-secondary">
                        Réponse : <span className="font-medium text-foreground">{formatTime(policy.responseTime)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-foreground-secondary">
                        Résolution : <span className="font-medium text-foreground">{formatTime(policy.resolutionTime)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaved && (
                      <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" /> Sauvé
                      </span>
                    )}
                    <button
                      onClick={() => handleEdit(policy)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover hover:bg-surface-inset border border-th-border text-foreground-muted hover:text-foreground transition-colors"
                    >
                      Modifier
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                <span className="text-xs text-foreground-muted flex-1">Non configuré</span>
                <button
                  onClick={() => handleCreate(priority)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                >
                  Configurer
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// TICKET CATEGORIES MANAGEMENT (Admin)
// ============================================================================

interface TicketCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f97316', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b',
];

function TicketCategoriesManagement() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', color: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const fetchCategories = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;
    try {
      const data = await api.getTicketCategories(token) as TicketCategory[];
      setCategories(data);
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (cat: TicketCategory) => {
    setEditingId(cat.id);
    setEditValues({ name: cat.name, color: cat.color });
  };

  const handleSave = async (cat: TicketCategory) => {
    const token = await getValidAccessToken();
    if (!token || !editValues.name.trim()) return;
    setIsSaving(true);
    try {
      await api.updateTicketCategory(cat.id, { name: editValues.name.trim(), color: editValues.color }, token);
      await fetchCategories();
      setEditingId(null);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const token = await getValidAccessToken();
    if (!token) return;
    try {
      await api.deleteTicketCategory(id, token);
      await fetchCategories();
    } catch { /* ignore */ }
  };

  const handleAdd = async () => {
    const token = await getValidAccessToken();
    if (!token || !newName.trim()) return;
    setIsSaving(true);
    try {
      await api.createTicketCategory({ name: newName.trim(), color: newColor }, token);
      await fetchCategories();
      setNewName('');
      setNewColor('#6366f1');
      setIsAdding(false);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const isEditing = editingId === cat.id;

        return (
          <div
            key={cat.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface-tertiary border border-th-border/50 transition-colors"
          >
            {isEditing ? (
              <>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditValues(v => ({ ...v, color: c }))}
                        className={`w-5 h-5 rounded-full transition-all ${editValues.color === c ? 'ring-2 ring-accent ring-offset-1 ring-offset-[var(--surface-tertiary)] scale-110' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))}
                    className="flex-1 h-8 px-3 text-sm rounded-lg bg-surface-secondary border border-th-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    maxLength={50}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(cat)}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                  >
                    {isSaving ? '...' : 'OK'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover border border-th-border text-foreground-muted hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover hover:bg-surface-inset border border-th-border text-foreground-muted hover:text-foreground transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Add new category */}
      {isAdding ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-tertiary border border-accent/30 transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-all ${newColor === c ? 'ring-2 ring-accent ring-offset-1 ring-offset-[var(--surface-tertiary)] scale-110' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la catégorie..."
              className="flex-1 h-8 px-3 text-sm rounded-lg bg-surface-secondary border border-th-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-accent"
              maxLength={50}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isSaving || !newName.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
            >
              {isSaving ? '...' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(''); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover border border-th-border text-foreground-muted hover:text-foreground transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-th-border/60 hover:border-accent/40 hover:bg-accent/5 text-xs font-medium text-foreground-muted hover:text-accent transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une catégorie
        </button>
      )}
    </div>
  );
}

// ============================================================================
// SETTINGS PAGE
// ============================================================================

export default function SettingsPage() {
  const { user, refreshUser, isAdminView } = useAuth();
  const {
    themeMode,
    setThemeMode,
    colorTheme,
    setColorTheme,
    density,
    setDensity,
    animationsEnabled,
    setAnimationsEnabled,
  } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notifications, setNotifications] = useState(true);

  // Editable profile fields
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    setProfileError('');
    setIsSavingProfile(true);

    try {
      await api.updateProfile({ firstName, lastName }, token);
      await refreshUser();
      setIsEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Erreur lors de la mise à jour';
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setIsEditingProfile(false);
  };

  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('Le mot de passe doit contenir une minuscule, une majuscule et un chiffre');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    const token = await getValidAccessToken();
    if (!token) return;

    setIsSavingPassword(true);

    try {
      await api.updateProfile({ currentPassword, newPassword }, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Erreur lors de la mise à jour';
      setPasswordError(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Filter tabs: system only for admins
  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdminView);

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-foreground-muted text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <GlassCard className="p-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                  }
                `}
              >
                <span className={activeTab === tab.key ? 'text-accent' : 'text-foreground-muted'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* ============================================================ */}
          {/* PROFILE TAB */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar & Identity */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent border-2 border-accent/30">
                      {initials}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-foreground-muted">{user?.email}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/15 text-accent">
                        {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-surface-hover hover:bg-surface-inset border border-th-border text-foreground transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                <div className="border-t border-th-border pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditingProfile ? (
                      <>
                        <Field label="Prénom" value={firstName} onChange={setFirstName} />
                        <Field label="Nom" value={lastName} onChange={setLastName} />
                      </>
                    ) : (
                      <>
                        <Field label="Prénom" value={user?.firstName || ''} disabled />
                        <Field label="Nom" value={user?.lastName || ''} disabled />
                      </>
                    )}
                    <Field label="Email" value={user?.email || ''} disabled />
                    <Field label="Rôle" value={user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'} disabled />
                  </div>

                  {isEditingProfile && (
                    <div className="flex items-center gap-3 mt-5">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-5 py-2 text-sm font-medium rounded-xl bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={handleCancelProfile}
                        disabled={isSavingProfile}
                        className="px-5 py-2 text-sm font-medium rounded-xl bg-surface-hover hover:bg-surface-inset border border-th-border text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  )}

                  {profileError && (
                    <div className="px-4 py-2.5 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-sm text-rose-500 dark:text-rose-400 font-medium">{profileError}</p>
                    </div>
                  )}

                  {profileSaved && (
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckIcon />
                      <span className="text-sm text-emerald-500 dark:text-emerald-400 font-medium">Profil mis à jour</span>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Organization Info */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Organisation</h3>
                    <p className="text-xs text-foreground-muted">Informations de votre entreprise</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nom" value={user?.organizationName || user?.organizationSlug || '-'} disabled />
                  <Field label="Statut du compte" value={user?.status === 'ACTIVE' ? 'Actif' : user?.status === 'PENDING' ? 'En attente' : user?.status === 'SUSPENDED' ? 'Suspendu' : user?.status || ''} disabled />
                </div>

                {isAdminView && (
                  <OrgAdvancedInfo organizationId={user?.organizationId || ''} />
                )}
              </GlassCard>
            </>
          )}

          {/* ============================================================ */}
          {/* THEME TAB - PREMIUM DESIGN */}
          {/* ============================================================ */}
          {activeTab === 'theme' && (
            <>
              {/* Section A: Appearance */}
              <GlassCard className="p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground">Apparence</h3>
                  <p className="text-xs text-foreground-muted mt-1">Choisissez le mode d&apos;affichage</p>
                </div>

                <div className="flex gap-4">
                  <ThemeModeCard
                    mode="light"
                    label="Clair"
                    isActive={themeMode === 'light'}
                    onClick={() => setThemeMode('light')}
                    icon={<SunIcon />}
                  />
                  <ThemeModeCard
                    mode="dark"
                    label="Sombre"
                    isActive={themeMode === 'dark'}
                    onClick={() => setThemeMode('dark')}
                    icon={<MoonIcon />}
                  />
                </div>
              </GlassCard>

              {/* Section B: Color Palette */}
              <GlassCard className="p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground">Palette de couleurs</h3>
                  <p className="text-xs text-foreground-muted mt-1">Couleurs primaire et secondaire de l&apos;interface</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_THEMES.map((preset) => (
                    <PaletteCard
                      key={preset.id}
                      theme={preset}
                      isActive={colorTheme.id === preset.id}
                      onClick={() => setColorTheme(preset)}
                    />
                  ))}
                </div>

                {/* Active palette info */}
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-tertiary border border-th-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorTheme.accent }} />
                    <span className="text-xs text-foreground-muted">Primaire</span>
                  </div>
                  <div className="w-px h-4 bg-th-border" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorTheme.secondary }} />
                    <span className="text-xs text-foreground-muted">Secondaire</span>
                  </div>
                  <div className="w-px h-4 bg-th-border" />
                  <span className="text-xs font-medium text-foreground">{colorTheme.name}</span>
                </div>
              </GlassCard>

              {/* Section C: Interface */}
              <GlassCard className="p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground">Interface</h3>
                  <p className="text-xs text-foreground-muted mt-1">Ajustez le comportement de l&apos;interface</p>
                </div>

                <div className="space-y-0">
                  {/* Density */}
                  <div className="flex items-center justify-between py-4 border-b border-th-border/40">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-surface-tertiary flex items-center justify-center text-foreground-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Densité d&apos;affichage</p>
                        <p className="text-[11px] text-foreground-muted mt-0.5">Espace entre les éléments</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-surface-tertiary rounded-xl p-1 border border-th-border/40">
                      <button
                        onClick={() => setDensity('comfortable')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          density === 'comfortable'
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        Confort
                      </button>
                      <button
                        onClick={() => setDensity('compact')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          density === 'compact'
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        Compact
                      </button>
                    </div>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-surface-tertiary flex items-center justify-center text-foreground-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Animations</p>
                        <p className="text-[11px] text-foreground-muted mt-0.5">Effets visuels et transitions</p>
                      </div>
                    </div>
                    <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
                  </div>
                </div>
              </GlassCard>

              {/* Auto-save indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Modifications enregistrées automatiquement
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* PREFERENCES TAB */}
          {/* ============================================================ */}
          {activeTab === 'preferences' && (
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Préférences</h3>
              <p className="text-xs text-foreground-muted mb-5">Personnalisez votre expérience</p>

              <div className="space-y-0">
                {/* Notifications */}
                <div className="flex items-center justify-between py-4 border-b border-th-border/40">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground-muted">
                      <BellIcon />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Notifications bureau</p>
                      <p className="text-xs text-foreground-muted">Recevoir des alertes pour les nouveaux tickets</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications} onChange={setNotifications} />
                </div>

                {/* Language */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-surface-tertiary flex items-center justify-center text-foreground-muted text-xs font-semibold">
                      {language === 'fr' ? '🇫🇷' : '🇬🇧'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.language}</p>
                      <p className="text-xs text-foreground-muted">{language === 'fr' ? 'Langue de l\'interface' : 'Interface language'}</p>
                    </div>
                  </div>
                  <div className="w-40">
                    <Select
                      value={language}
                      onChange={(val) => setLanguage(val as Language)}
                      options={languageOptions}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* ============================================================ */}
          {/* SECURITY TAB */}
          {/* ============================================================ */}
          {activeTab === 'security' && (
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Changer le mot de passe</h3>
              <p className="text-xs text-foreground-muted mb-5">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
              </p>

              <div className="space-y-4 max-w-md">
                <Field
                  label="Mot de passe actuel"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  type="password"
                  placeholder="Entrez votre mot de passe actuel"
                />
                <Field
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                  placeholder="Entrez un nouveau mot de passe"
                />
                <Field
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  placeholder="Confirmez le nouveau mot de passe"
                />

                {passwordError && (
                  <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-sm text-rose-500 dark:text-rose-400 font-medium">{passwordError}</p>
                  </div>
                )}

                {passwordSaved && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckIcon />
                    <span className="text-sm text-emerald-500 dark:text-emerald-400 font-medium">Mot de passe mis à jour</span>
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Votre compte est protégé par un mot de passe. Changez-le régulièrement pour plus de sécurité.
                </p>
              </div>
            </GlassCard>
          )}

          {/* ============================================================ */}
          {/* SYSTEM TAB (Admin only) */}
          {/* ============================================================ */}
          {activeTab === 'system' && isAdminView && (
            <>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10">
                  <GearIcon />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Configuration système</h2>
                  <p className="text-xs text-foreground-muted">Paramètres avancés de votre organisation</p>
                </div>
              </div>

              {/* SLA Configuration */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">SLA (Service Level Agreement)</h3>
                      <p className="text-[11px] text-foreground-muted mt-0.5">Temps de réponse et résolution par priorité</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    SLA
                  </span>
                </div>

                <SlaManagement />

                <div className="mt-4 px-4 py-2.5 rounded-xl bg-surface-tertiary/60 border border-th-border/30">
                  <p className="text-[11px] text-foreground-muted">
                    Les délais SLA s&apos;appliquent automatiquement aux nouveaux tickets selon leur priorité.
                  </p>
                </div>
              </GlassCard>

              {/* Ticket Categories */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Types de tickets</h3>
                      <p className="text-[11px] text-foreground-muted mt-0.5">Gérez les catégories disponibles lors de la création de tickets</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    Types
                  </span>
                </div>

                <TicketCategoriesManagement />

                <div className="mt-4 px-4 py-2.5 rounded-xl bg-surface-tertiary/60 border border-th-border/30">
                  <p className="text-[11px] text-foreground-muted">
                    Les types ajoutés apparaîtront dans le formulaire de création de ticket pour tous les utilisateurs.
                  </p>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

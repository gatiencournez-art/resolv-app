'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme, PRESET_THEMES } from '@/contexts/theme-context';
import { useLanguage, type Language } from '@/contexts/language-context';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

type SettingsTab = 'profile' | 'theme' | 'preferences' | 'security';

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

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          bg-white/[0.04] dark:bg-white/[0.04]
          border-white/[0.08] dark:border-white/[0.08] border-[var(--border)]
          text-foreground placeholder:text-foreground-muted
          focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
          ${disabled || !onChange ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
}

// ============================================================================
// COLOR PICKER
// ============================================================================

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
        />
        <span className="text-xs font-mono text-foreground-muted uppercase">{value}</span>
      </div>
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

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profil', icon: <UserIcon /> },
  { key: 'theme', label: 'Thème', icon: <SwatchIcon /> },
  { key: 'preferences', label: 'Préférences', icon: <PaletteIcon /> },
  { key: 'security', label: 'Sécurité', icon: <ShieldIcon /> },
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
    <div className="mt-5 pt-5 border-t border-white/[0.06] dark:border-white/[0.06] border-[var(--border)]">
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
        <div className="mt-3 p-4 rounded-xl bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.05] dark:border-white/[0.05] border-[var(--border)]/50">
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
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-white/[0.06] dark:bg-white/[0.06] hover:bg-white/[0.1] dark:hover:bg-white/[0.1] border border-white/[0.08] dark:border-white/[0.08] border-[var(--border)] text-foreground-muted hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span className="text-emerald-400">Copié</span>
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
// ACCENT COLORS
// ============================================================================

const ACCENT_COLORS = [
  { id: 'indigo', name: 'Indigo', color: '#6366f1', hover: '#4f46e5' },
  { id: 'blue', name: 'Bleu', color: '#3b82f6', hover: '#2563eb' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6', hover: '#7c3aed' },
  { id: 'teal', name: 'Teal', color: '#14b8a6', hover: '#0d9488' },
  { id: 'emerald', name: 'Emeraude', color: '#10b981', hover: '#059669' },
  { id: 'rose', name: 'Rose', color: '#f43f5e', hover: '#e11d48' },
  { id: 'amber', name: 'Ambre', color: '#f59e0b', hover: '#d97706' },
  { id: 'slate', name: 'Ardoise', color: '#64748b', hover: '#475569' },
];

// ============================================================================
// APPEARANCE MODE CARD
// ============================================================================

function AppearanceModeCard({
  mode,
  label,
  description,
  isActive,
  onClick,
  icon,
}: {
  mode: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 group
        ${isActive
          ? 'border-accent bg-accent/[0.08]'
          : 'border-white/[0.06] dark:border-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.12] bg-white/[0.02] dark:bg-white/[0.02]'
        }
      `}
    >
      {/* Mode Preview */}
      <div className={`
        w-16 h-12 rounded-xl mb-3 flex items-center justify-center transition-transform duration-200 group-hover:scale-105
        ${mode === 'dark' ? 'bg-[#0d0d14] border border-white/[0.1]' : ''}
        ${mode === 'light' ? 'bg-white border border-gray-200' : ''}
        ${mode === 'system' ? 'bg-gradient-to-r from-[#0d0d14] to-white border border-white/[0.1]' : ''}
      `}>
        <span className={mode === 'light' ? 'text-gray-600' : 'text-white/70'}>{icon}</span>
      </div>
      <span className="text-sm font-semibold text-foreground mb-0.5">{label}</span>
      <span className="text-[10px] text-foreground-muted">{description}</span>
      {isActive && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <CheckIcon />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// ACCENT COLOR DOT
// ============================================================================

function AccentColorDot({
  color,
  name,
  isActive,
  onClick,
}: {
  color: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={name}
      className={`
        relative w-10 h-10 rounded-full transition-all duration-200 group
        ${isActive ? 'scale-110' : 'hover:scale-110'}
      `}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 0 3px var(--surface), 0 0 0 5px ${color}, 0 0 20px ${color}40` : 'none',
      }}
    >
      {isActive && (
        <span className="absolute inset-0 flex items-center justify-center text-white">
          <CheckIcon />
        </span>
      )}
      <span className="sr-only">{name}</span>
    </button>
  );
}

// ============================================================================
// SETTING ROW
// ============================================================================

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.04] dark:border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] flex items-center justify-center text-foreground-muted">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-foreground-muted mt-0.5">{description}</p>
        </div>
      </div>
      {children}
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
    resolvedTheme,
    colorTheme,
    setAccentColor,
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
    const token = getAccessToken();
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

    const token = getAccessToken();
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

  // Find matching accent color
  const currentAccentId = ACCENT_COLORS.find((c) => c.color === colorTheme.accent)?.id || 'indigo';

  return (
    <div className="relative">
      {/* Ambient glows */}
      <div className="fixed top-0 left-60 right-0 bottom-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] right-[20%] w-[400px] h-[400px] bg-violet-500/[0.05] dark:bg-violet-500/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-[5%] left-[10%] w-[350px] h-[350px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-foreground-muted text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <GlassCard className="p-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeTab === t.key
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.04] dark:hover:bg-white/[0.04]'
                  }
                `}
              >
                <span className={activeTab === t.key ? 'text-accent' : 'text-foreground-muted'}>{t.icon}</span>
                {t.label}
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
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-white/[0.06] dark:bg-white/[0.06] hover:bg-white/[0.1] dark:hover:bg-white/[0.1] border border-white/[0.08] dark:border-white/[0.08] border-[var(--border)] text-foreground transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                <div className="border-t border-white/[0.06] dark:border-white/[0.06] border-[var(--border)] pt-5">
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
                        className="px-5 py-2 text-sm font-medium rounded-xl bg-white/[0.06] dark:bg-white/[0.06] hover:bg-white/[0.1] dark:hover:bg-white/[0.1] border border-white/[0.08] dark:border-white/[0.08] border-[var(--border)] text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  )}

                  {profileError && (
                    <div className="px-4 py-2.5 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-sm text-rose-400 font-medium">{profileError}</p>
                    </div>
                  )}

                  {profileSaved && (
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckIcon />
                      <span className="text-sm text-emerald-400 font-medium">Profil mis à jour</span>
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

                {/* Advanced info — Admin only */}
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
              {/* Appearance Mode */}
              <GlassCard className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Apparence</h3>
                <p className="text-xs text-foreground-muted mb-5">Choisissez le mode d&apos;affichage de l&apos;interface</p>

                <div className="grid grid-cols-3 gap-4">
                  <AppearanceModeCard
                    mode="light"
                    label="Clair"
                    description="Thème lumineux"
                    isActive={themeMode === 'light'}
                    onClick={() => setThemeMode('light')}
                    icon={<SunIcon />}
                  />
                  <AppearanceModeCard
                    mode="dark"
                    label="Sombre"
                    description="Thème foncé"
                    isActive={themeMode === 'dark'}
                    onClick={() => setThemeMode('dark')}
                    icon={<MoonIcon />}
                  />
                  <AppearanceModeCard
                    mode="system"
                    label="Système"
                    description="Suit votre OS"
                    isActive={themeMode === 'system'}
                    onClick={() => setThemeMode('system')}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                </div>

                {themeMode === 'system' && (
                  <p className="text-[11px] text-foreground-muted mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Mode actuel : {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
                  </p>
                )}
              </GlassCard>

              {/* Accent Color */}
              <GlassCard className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Couleur d&apos;accent</h3>
                <p className="text-xs text-foreground-muted mb-5">Personnalisez la couleur principale de l&apos;interface</p>

                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((accent) => (
                    <AccentColorDot
                      key={accent.id}
                      color={accent.color}
                      name={accent.name}
                      isActive={currentAccentId === accent.id}
                      onClick={() => setAccentColor(accent.color, accent.hover)}
                    />
                  ))}
                </div>

                <p className="text-[11px] text-foreground-muted mt-4">
                  Couleur sélectionnée : <span className="font-medium text-accent">{ACCENT_COLORS.find((c) => c.id === currentAccentId)?.name || 'Personnalisée'}</span>
                </p>
              </GlassCard>

              {/* Interface Settings */}
              <GlassCard className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Interface</h3>
                <p className="text-xs text-foreground-muted mb-5">Ajustez le comportement de l&apos;interface</p>

                <div className="space-y-0">
                  {/* Density */}
                  <SettingRow
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    }
                    title="Densité d'affichage"
                    description="Espace entre les éléments"
                  >
                    <div className="flex items-center gap-2 bg-white/[0.04] dark:bg-white/[0.04] rounded-xl p-1">
                      <button
                        onClick={() => setDensity('comfortable')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          density === 'comfortable'
                            ? 'bg-accent text-white'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        Confort
                      </button>
                      <button
                        onClick={() => setDensity('compact')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          density === 'compact'
                            ? 'bg-accent text-white'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        Compact
                      </button>
                    </div>
                  </SettingRow>

                  {/* Animations */}
                  <SettingRow
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    title="Animations"
                    description="Effets visuels et transitions"
                  >
                    <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
                  </SettingRow>
                </div>
              </GlassCard>

              {/* Auto-save indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
                <div className="flex items-center justify-between py-4 border-b border-white/[0.06] dark:border-white/[0.06] border-[var(--border)]">
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
                    <span className="w-9 h-9 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] flex items-center justify-center text-foreground-muted text-xs font-semibold">
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
                    <p className="text-sm text-rose-400 font-medium">{passwordError}</p>
                  </div>
                )}

                {passwordSaved && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckIcon />
                    <span className="text-sm text-emerald-400 font-medium">Mot de passe mis à jour</span>
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
                <p className="text-xs text-amber-300 dark:text-amber-300 text-amber-600">
                  Votre compte est protégé par un mot de passe. Changez-le régulièrement pour plus de sécurité.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

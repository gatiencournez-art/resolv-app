'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Badge } from '@/components/ui';
import { NotificationBell } from './notification-bell';

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

export function Header() {
  const { user, logout, previewMode, togglePreviewMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = user?.role === 'ADMIN';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <header className="h-14 bg-surface border-b border-th-border px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Removed Dashboard text - organization name shown in sidebar */}
      </div>

      <div className="flex items-center gap-2">
        {/* Preview Mode Toggle (Admin only) */}
        {isAdmin && (
          <button
            onClick={togglePreviewMode}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150
              ${previewMode
                ? 'bg-accent-muted border-accent text-accent'
                : 'bg-surface border-th-border text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {previewMode ? 'Vue Admin' : 'Aperçu Demandeur'}
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
          aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-hover transition-all duration-150"
          >
            <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-medium">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-surface rounded-xl shadow-elevated border border-th-border py-1 z-50 animate-slide-down">
              <div className="px-4 py-3 border-b border-th-border">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">{user?.email}</p>
                <Badge
                  variant={user?.role === 'ADMIN' ? 'primary' : 'default'}
                  className="mt-2"
                >
                  {user?.role === 'ADMIN' ? 'Admin' : 'Utilisateur'}
                </Badge>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--priority-critical)] hover:bg-surface-hover transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

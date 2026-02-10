'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';


interface ApiError {
  message?: string;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#0b0618]">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M17 11V8a5 5 0 0 0-10 0v3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    organizationSlug: '',
    email: '',
    password: '',
    rememberMe: true,
  });

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!formData.organizationSlug) errs.organizationSlug = 'Organisation requise.';
    if (!formData.email || !isEmail(formData.email)) errs.email = 'Adresse email invalide.';
    if (!formData.password) errs.password = 'Mot de passe requis.';

    return errs;
  }, [formData]);

  const canSubmit = Object.keys(fieldErrors).length === 0 && !isLoading;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type } = e.target;
    const value =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData((p) => ({ ...p, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      await login(
        formData.email.trim(),
        formData.password,
        formData.organizationSlug.trim()
      );
    } catch (err) {
      const apiError = err as ApiError;
      const msg = apiError?.message || 'Impossible de se connecter.';
      if (msg.toLowerCase().includes('attente')) {
        setIsPending(true);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0618] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#140a2b] via-[#0b0618] to-black" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:26px_26px]" />

        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-[520px] rounded-[22px] border border-white/15 bg-white/[0.08] p-10 backdrop-blur-2xl shadow-[0_30px_100px_-55px_rgba(0,0,0,1)] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Compte en attente</h1>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Votre compte est en attente de validation par un administrateur.<br />
              Vous pourrez vous connecter une fois votre accès approuvé.
            </p>
            <button
              onClick={() => setIsPending(false)}
              className="inline-block mt-8 px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0618] text-white">
      {/* fond très sombre */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#140a2b] via-[#0b0618] to-black" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:26px_26px]" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[520px] rounded-[22px] border border-white/15 bg-white/[0.08] p-10 backdrop-blur-2xl shadow-[0_30px_100px_-55px_rgba(0,0,0,1)]">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Connexion</h1>
            <p className="mt-2 text-sm text-white/70">
              Accédez à votre plateforme de ticketing et gérez vos demandes IT en toute sécurité.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Organisation */}
            <input
              name="organizationSlug"
              placeholder="Organisation (ex : dexton-consulting)"
              value={formData.organizationSlug}
              onChange={handleInput}
              className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
              required
            />

            {/* Email */}
            <div className="relative">
              <input
                name="email"
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={handleInput}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 pr-12 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                <UserIcon />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <input
                name="password"
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleInput}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 pr-12 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                <LockIcon />
              </div>
            </div>

            {/* options */}
            <div className="flex items-center justify-between text-sm text-white/80">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInput}
                  className="hidden"
                />
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    formData.rememberMe
                      ? 'bg-white border-white'
                      : 'border-white/40 bg-white/5'
                  }`}
                >
                  {formData.rememberMe && <CheckIcon />}
                </span>
                <span>Se souvenir de moi</span>
              </label>

              <Link href="/forgot-password" className="hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="h-12 w-full rounded-full bg-white text-[#0b0618] font-semibold text-sm hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Se connecter'
              )}
            </button>

            <div className="text-center text-sm text-white/75 space-y-2">
              <div>
                <Link href="/join" className="hover:underline">
                  Rejoindre une organisation
                </Link>
              </div>
              <div>
                <Link href="/register" className="hover:underline">
                  Créer une organisation
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

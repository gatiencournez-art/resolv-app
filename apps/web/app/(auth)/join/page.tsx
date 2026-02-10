'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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

export default function JoinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accepted, setAccepted] = useState(true);

  const [formData, setFormData] = useState({
    organizationSlug: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!formData.organizationSlug.trim()) errs.organizationSlug = "Identifiant d'organisation requis.";
    if (!formData.firstName.trim()) errs.firstName = 'Prénom requis.';
    if (!formData.lastName.trim()) errs.lastName = 'Nom requis.';

    const email = formData.email.trim();
    if (!email || !isEmail(email)) errs.email = 'Adresse email invalide.';

    if (!formData.password) errs.password = 'Mot de passe requis.';
    else if (formData.password.length < 8) errs.password = 'Au moins 8 caractères.';

    if (!formData.confirmPassword) errs.confirmPassword = 'Confirmation requise.';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas.';

    if (!accepted) errs.accepted = "Tu dois accepter avant de continuer.";

    return errs;
  }, [formData, accepted]);

  const canSubmit = useMemo(() => Object.keys(fieldErrors).length === 0 && !isLoading, [fieldErrors, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Vérifie les champs.');
      return;
    }

    setIsLoading(true);
    try {
      await api.join({
        organizationSlug: formData.organizationSlug.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      setSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0618] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#140a2b] via-[#0b0618] to-black" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:26px_26px]" />

        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-[520px] rounded-[22px] border border-white/15 bg-white/[0.08] p-10 backdrop-blur-2xl shadow-[0_30px_100px_-55px_rgba(0,0,0,1)] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Demande envoyée</h1>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Votre compte est en attente de validation par un administrateur de l'organisation.
              Vous recevrez un accès dès qu'il sera approuvé.
            </p>
            <Link
              href="/login"
              className="inline-block mt-8 px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0618] text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#140a2b] via-[#0b0618] to-black" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:26px_26px]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px] rounded-[22px] border border-white/15 bg-white/[0.08] p-10 backdrop-blur-2xl shadow-[0_30px_100px_-55px_rgba(0,0,0,1)]">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Rejoindre une organisation</h1>
            <p className="mt-2 text-sm text-white/70">
              Demandez l'accès à l'espace de ticketing de votre équipe.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Organisation slug */}
            <div>
              <input
                name="organizationSlug"
                placeholder="Identifiant de l'organisation (ex : dexton-consulting)"
                value={formData.organizationSlug}
                onChange={handleChange}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              {fieldErrors.organizationSlug && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.organizationSlug}</p>}
            </div>

            {/* Prénom / Nom */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <input
                  name="firstName"
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                  required
                />
                {fieldErrors.firstName && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <input
                  name="lastName"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                  required
                />
                {fieldErrors.lastName && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={handleChange}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              {fieldErrors.email && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.email}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <input
                name="password"
                type="password"
                placeholder="Mot de passe (min. 8 caractères)"
                value={formData.password}
                onChange={handleChange}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              {fieldErrors.password && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.password}</p>}
            </div>

            {/* Confirmation */}
            <div>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 placeholder:text-white/50 outline-none transition focus:border-white/40"
                required
              />
              {fieldErrors.confirmPassword && <p className="mt-2 text-xs text-red-100/90">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Acceptation */}
            <div className="flex items-start justify-between gap-6 text-sm text-white/80">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="hidden"
                />
                <span
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    accepted ? 'bg-white border-white' : 'border-white/40 bg-white/5'
                  }`}
                >
                  {accepted && <CheckIcon />}
                </span>
                <span>J'accepte les règles de sécurité de l'organisation.</span>
              </label>
            </div>

            {fieldErrors.accepted && <p className="text-xs text-red-100/90">{fieldErrors.accepted}</p>}

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
                'Demander l\'accès'
              )}
            </button>

            <div className="text-center text-sm text-white/75">
              Déjà un compte ?{' '}
              <Link href="/login" className="hover:underline">
                Se connecter
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

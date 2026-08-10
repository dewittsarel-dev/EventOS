'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { isDevelopmentAuthBypassEnabled } from '../../components/app-shell/protected-routes';
import { useAppSession } from '../../components/app-shell/session-context';
import { loginWithPassword, seedDevelopmentWorkspace } from '../../lib/auth-api';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { session, setSession } = useAppSession();

  const [baseUrl, setBaseUrl] = useState(session.baseUrl || 'http://localhost:3001');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const developmentMode = isDevelopmentAuthBypassEnabled();

  useEffect(() => {
    if (session.token) {
      router.replace(nextPath);
    }
  }, [nextPath, router, session.token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await loginWithPassword(baseUrl, {
        email: email.trim(),
        password,
      });

      setSession({
        baseUrl,
        token: response.accessToken,
        organizationId: session.organizationId,
      });

      router.replace(nextPath);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Login failed.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDemoSignIn() {
    setError('');
    setSaving(true);

    try {
      const response = await seedDevelopmentWorkspace(baseUrl);

      setSession({
        baseUrl,
        token: response.accessToken,
        organizationId: response.organizationId,
      });

      router.replace(nextPath);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Demo sign in failed.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative overflow-hidden bg-zinc-950 p-7 text-white sm:p-10 lg:min-h-[35rem]">
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_15%_15%,rgba(251,191,36,0.32),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(71,85,105,0.55),transparent_36%)]" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">EventOS ClientOS</p>
            <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Run every event from one clear workspace.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300 sm:text-base">Coordinate enquiries, planning, suppliers, execution and financial control without losing the decisions behind the work.</p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-3 lg:grid-cols-1">
            {['One operational source of truth', 'AI guidance with human approval', 'Connected directly to Marketplace'].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-zinc-950">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center p-6 sm:p-10 lg:p-12">
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Private business workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Sign in with your EventOS account to continue to ClientOS.</p>

          <form onSubmit={onSubmit} className="mt-7">
        {developmentMode ? <details className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-zinc-700"><summary className="cursor-pointer font-medium">Developer connection</summary><label className="mt-3 block">API address<input className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="http://localhost:3001" required /></label></details> : null}

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Email
          <input
            type="email"
            autoComplete="email"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 flex-1 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
          >
            {saving ? 'Signing in...' : 'Sign in'}
          </button>

          {developmentMode ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onDemoSignIn()}
              className="min-h-11 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
            >
              Sign in as Demo Administrator
            </button>
          ) : null}
        </div>
          </form>
          <div className="mt-7 border-t border-zinc-200 pt-5 text-sm text-zinc-500">
            Planning an event as a customer?{' '}
            <a href="/marketplace" className="font-semibold text-zinc-900 underline decoration-amber-400 decoration-2 underline-offset-4 hover:text-amber-700">Explore Marketplace</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          Loading login...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

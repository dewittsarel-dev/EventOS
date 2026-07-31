'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/app-shell/page-header';
import { useAppSession } from '../../components/app-shell/session-context';
import { loginWithPassword } from '../../lib/auth-api';

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

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="Sign In"
        description="Use your existing EventOS account to restore workspace context."
      />

      <form
        onSubmit={onSubmit}
        className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <label className="block text-sm text-zinc-700">
          API Base URL
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="http://localhost:3001"
            required
          />
        </label>

        <label className="mt-4 block text-sm text-zinc-700">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm text-zinc-700">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {saving ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
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

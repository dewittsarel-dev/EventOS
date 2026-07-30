'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listContacts } from '@/lib/contacts-api';
import { listEvents } from '@/lib/events-api';
import { listQuotations } from '@/lib/quotations-api';
import { listTasks } from '@/lib/tasks-api';

type DashboardCounts = {
  contacts: number;
  events: number;
  quotations: number;
  tasks: number;
};

const defaultCounts: DashboardCounts = {
  contacts: 0,
  events: 0,
  quotations: 0,
  tasks: 0,
};

export default function DashboardPage() {
  const { session, user, activeOrganization } = useAppSession();
  const [counts, setCounts] = useState<DashboardCounts>(defaultCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCounts() {
      if (!session.token || !session.organizationId) {
        setCounts(defaultCounts);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [contactsResponse, eventsResponse, quotationsResponse, tasksResponse] =
          await Promise.all([
            listContacts(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              session.organizationId,
            ),
            listEvents(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              {
                organizationId: session.organizationId,
                page: 1,
                limit: 1,
              },
            ),
            listQuotations(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              {
                organizationId: session.organizationId,
                page: 1,
                limit: 1,
              },
            ),
            listTasks(
              {
                token: session.token,
                baseUrl: session.baseUrl,
              },
              {
                organizationId: session.organizationId,
                page: 1,
                limit: 1,
              },
            ),
          ]);

        setCounts({
          contacts: contactsResponse.data.length,
          events: eventsResponse.meta.total,
          quotations: quotationsResponse.meta.total,
          tasks: tasksResponse.meta.total,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load dashboard metrics.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCounts();
  }, [session.baseUrl, session.organizationId, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description="Command center for ClientOS operations."
        actions={
          <>
            <Link
              href="/events/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Create Event
            </Link>
            <Link
              href="/quotations/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              New Quotation
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Contacts</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{counts.contacts}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Events</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{counts.events}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Quotations</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{counts.quotations}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Tasks</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{counts.tasks}</p>
        </article>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Workspace Context</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {user ? `Signed in as ${user.email}.` : 'No authenticated user loaded yet.'}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          {activeOrganization
            ? `Organization: ${activeOrganization.name}`
            : session.organizationId
              ? `Organization ID: ${session.organizationId}`
              : 'No organization selected.'}
        </p>
      </section>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading dashboard metrics...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

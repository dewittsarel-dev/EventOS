'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { listContacts } from '@/lib/contacts-api';
import type { ContactRecord } from '@/lib/contacts-types';

export default function ContactsPage() {
  const { session } = useAppSession();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadContacts() {
      if (!session.token || !session.organizationId) {
        setContacts([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await listContacts(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
        );

        setContacts(response.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load contacts.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadContacts();
  }, [session.baseUrl, session.organizationId, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contacts"
        description="Directory of people linked to your operational workflows."
        actions={
          <Link
            href="/events/new"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Create Event
          </Link>
        }
      />

      {!session.organizationId ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select an organization in the header to load contacts.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading contacts...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No contacts found for this organization.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Phone</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 text-zinc-900">
                      {contact.firstName} {contact.lastName ?? ''}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{contact.email ?? '-'}</td>
                    <td className="px-4 py-3 text-zinc-700">{contact.phone ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

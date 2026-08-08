'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { createContact } from '@/lib/contacts-api';

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  companyName: string;
  contactType: string;
  address: string;
  notes: string;
};

const defaultForm: ContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mobile: '',
  companyName: '',
  contactType: '',
  address: '',
  notes: '',
};

export default function NewContactPage() {
  const { session } = useAppSession();
  const [form, setForm] = useState<ContactForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token || !session.organizationId) {
      setError('Please save Bearer token and Organization ID first.');
      return;
    }

    if (!form.firstName.trim()) {
      setError('First name is required.');
      return;
    }

    setSaving(true);

    try {
      await createContact(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        {
          organizationId: session.organizationId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          mobile: form.mobile.trim() || undefined,
          companyName: form.companyName.trim() || undefined,
          contactType: form.contactType.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      );

      setSuccess('Contact created successfully.');
      setForm(defaultForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create contact.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Contact"
        description="Add a new contact to your active organization."
        actions={
          <Link
            href="/contacts"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Contacts
          </Link>
        }
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            First Name
            <input
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-zinc-700">
            Last Name
            <input
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Phone
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Mobile
            <input
              value={form.mobile}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, mobile: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Company or Organization
            <input
              value={form.companyName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, companyName: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Contact Type
            <input
              value={form.contactType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contactType: event.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Address
            <textarea
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}

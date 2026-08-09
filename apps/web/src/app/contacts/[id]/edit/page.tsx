'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import { getContact, updateContact } from '@/lib/contacts-api';
import type { ContactDetailsRecord } from '@/lib/contacts-types';

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

function toForm(contact: ContactDetailsRecord): ContactForm {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    mobile: contact.mobile ?? '',
    companyName: contact.companyName ?? '',
    contactType: contact.contactType ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
  };
}

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const contactId = String(params.id);

  const { session } = useAppSession();
  const [form, setForm] = useState<ContactForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadContact() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getContact(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          contactId,
        );

        setForm(toForm(response));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load contact.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadContact();
  }, [contactId, session.baseUrl, session.token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!session.token) {
      setError('Please sign in before editing this contact.');
      return;
    }

    if (!form.firstName.trim()) {
      setError('First name is required.');
      return;
    }

    setSaving(true);

    try {
      await updateContact(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        contactId,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          mobile: form.mobile.trim() || null,
          companyName: form.companyName.trim() || null,
          contactType: form.contactType.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        },
      );

      setSuccess('Contact updated successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update contact.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit Contact"
        actions={
          <Link
            href={`/contacts/${contactId}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Back to Details
          </Link>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading contact...
        </div>
      ) : (
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
              {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

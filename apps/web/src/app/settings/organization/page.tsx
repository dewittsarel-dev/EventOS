'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  getOrganizationSettings,
  updateOrganizationLogo,
  updateOrganizationSettings,
} from '../../../lib/organization-settings-api';
import type { OrganizationSettingsRecord } from '../../../lib/organization-settings-types';

type OrganizationForm = {
  companyName: string;
  tradingName: string;
  vatNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  website: string;
  physicalAddress: string;
  postalAddress: string;
  logoUrl: string;
};

const defaultForm: OrganizationForm = {
  companyName: '',
  tradingName: '',
  vatNumber: '',
  registrationNumber: '',
  email: '',
  phone: '',
  website: '',
  physicalAddress: '',
  postalAddress: '',
  logoUrl: '',
};

function toForm(record: OrganizationSettingsRecord): OrganizationForm {
  return {
    companyName: record.name,
    tradingName: record.tradingName ?? '',
    vatNumber: record.vatNumber ?? '',
    registrationNumber: record.registrationNumber ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    website: record.website ?? '',
    physicalAddress: record.physicalAddress ?? '',
    postalAddress: record.postalAddress ?? '',
    logoUrl: record.logoUrl ?? '',
  };
}

function firstLetter(value: string) {
  return value.trim().charAt(0).toUpperCase() || 'O';
}

export default function OrganizationSettingsPage() {
  const { session, activeOrganization } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OrganizationForm>(defaultForm);
  const [original, setOriginal] = useState<OrganizationForm>(defaultForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  useEffect(() => {
    async function loadOrganization() {
      if (!canLoad) {
        setForm(defaultForm);
        setOriginal(defaultForm);
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await getOrganizationSettings(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
        );

        const nextForm = toForm(response);
        setForm(nextForm);
        setOriginal(nextForm);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load organization settings.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOrganization();
  }, [canLoad, session.baseUrl, session.organizationId, session.token]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!canLoad) {
      setError('Please sign in and select an organization before saving settings.');
      return;
    }

    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateOrganizationSettings(
        {
          token: session.token,
          baseUrl: session.baseUrl,
        },
        session.organizationId,
        {
          companyName: form.companyName.trim(),
          tradingName: form.tradingName.trim() || undefined,
          vatNumber: form.vatNumber.trim() || undefined,
          registrationNumber: form.registrationNumber.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          physicalAddress: form.physicalAddress.trim() || undefined,
          postalAddress: form.postalAddress.trim() || undefined,
        },
      );

      let merged = toForm(updated);

      if (form.logoUrl.trim() && form.logoUrl.trim() !== (updated.logoUrl ?? '')) {
        const withLogo = await updateOrganizationLogo(
          {
            token: session.token,
            baseUrl: session.baseUrl,
          },
          session.organizationId,
          {
            logoUrl: form.logoUrl.trim(),
          },
        );

        merged = toForm(withLogo);
      }

      setForm(merged);
      setOriginal(merged);
      setSuccess('Organization settings saved.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to save organization settings.',
      );
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setForm(original);
    setError('');
    setSuccess('Changes reverted.');
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Organization Settings"
        description="Manage company profile and communication details for the active workspace."
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Sign in and select an organization to configure organization settings.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading organization details...
        </div>
      ) : null}

      {canLoad && !loading ? (
        <form
          onSubmit={onSave}
          className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6"
        >
          <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Company Logo</p>
              <div className="mt-3 flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-900 text-3xl font-semibold text-white">
                {firstLetter(form.companyName || activeOrganization?.name || 'Org')}
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                Upload flow is coming soon. Set a logo URL placeholder below.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-zinc-700">
                Company Name
                <input
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, companyName: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  required
                />
              </label>

              <label className="text-sm text-zinc-700">
                Trading Name
                <input
                  value={form.tradingName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tradingName: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-zinc-700">
                VAT Number
                <input
                  value={form.vatNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, vatNumber: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-zinc-700">
                Registration Number
                <input
                  value={form.registrationNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))
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
                  required
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

              <label className="text-sm text-zinc-700 md:col-span-2">
                Website
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, website: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-zinc-700 md:col-span-2">
                Physical Address
                <textarea
                  value={form.physicalAddress}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, physicalAddress: event.target.value }))
                  }
                  className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-zinc-700 md:col-span-2">
                Postal Address
                <textarea
                  value={form.postalAddress}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, postalAddress: event.target.value }))
                  }
                  className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-zinc-700 md:col-span-2">
                Company Logo URL Placeholder
                <input
                  type="url"
                  placeholder="https://cdn.example.com/logo.png"
                  value={form.logoUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, logoUrl: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>
            </div>
          </section>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
              onClick={onCancel}
              disabled={!isDirty || saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
              disabled={saving || !isDirty}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

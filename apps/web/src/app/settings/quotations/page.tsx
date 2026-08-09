'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/app-shell/page-header';
import { useAppSession } from '../../../components/app-shell/session-context';
import {
  createQuotation,
  deleteQuotation,
  listContacts,
  listEvents,
  listQuotations,
  updateQuotation,
  updateQuotationStatus,
} from '../../../lib/quotations-api';
import type {
  ContactOption,
  EventOption,
  QuotationRecord,
  QuotationStatus,
} from '../../../lib/quotations-types';
import { ConfirmDeleteQuotationDialog } from './components/confirm-delete-quotation-dialog';
import {
  QuotationDialogForm,
  type QuotationDialogFormValues,
} from './components/quotation-dialog-form';

type BusyAction = 'create' | 'edit' | 'delete' | 'status' | null;

type SortBy = 'createdAt' | 'updatedAt' | 'totalCents' | 'quoteNumber';
type SortOrder = 'asc' | 'desc';

const defaultForm: QuotationDialogFormValues = {
  contactId: '',
  eventId: '',
  title: '',
  notes: '',
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  taxRatePercent: 15,
  status: 'Draft',
  items: [
    {
      description: '',
      quantity: 1,
      unitPriceCents: 0,
      discountPercent: 0,
    },
  ],
};

function toDateInput(value: string | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

function statusPillClasses(status: QuotationStatus) {
  if (status === 'Draft') {
    return 'inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700';
  }

  if (status === 'Sent') {
    return 'inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700';
  }

  if (status === 'Accepted') {
    return 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700';
  }

  if (status === 'Rejected') {
    return 'inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700';
  }

  return 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700';
}

function toCreatePayload(
  form: QuotationDialogFormValues,
  organizationId: string,
) {
  return {
    organizationId,
    contactId: form.contactId,
    eventId: form.eventId || undefined,
    title: form.title,
    notes: form.notes || undefined,
    issueDate: form.issueDate
      ? new Date(`${form.issueDate}T00:00:00.000Z`).toISOString()
      : undefined,
    expiryDate: form.validUntil
      ? new Date(`${form.validUntil}T00:00:00.000Z`).toISOString()
      : undefined,
    taxRatePercent: form.taxRatePercent,
    status: form.status,
    items: form.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountPercent: item.discountPercent ?? 0,
    })),
  };
}

function toEditPayload(form: QuotationDialogFormValues) {
  return {
    contactId: form.contactId,
    eventId: form.eventId || undefined,
    title: form.title,
    notes: form.notes || undefined,
    issueDate: form.issueDate
      ? new Date(`${form.issueDate}T00:00:00.000Z`).toISOString()
      : undefined,
    expiryDate: form.validUntil
      ? new Date(`${form.validUntil}T00:00:00.000Z`).toISOString()
      : undefined,
    taxRatePercent: form.taxRatePercent,
    status: form.status,
    items: form.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountPercent: item.discountPercent ?? 0,
    })),
  };
}

function quotationToForm(quotation: QuotationRecord): QuotationDialogFormValues {
  return {
    contactId: quotation.contactId,
    eventId: quotation.eventId ?? '',
    title: quotation.title,
    notes: quotation.notes ?? '',
    issueDate: toDateInput(quotation.issueDate),
    validUntil: toDateInput(quotation.validUntil ?? quotation.expiryDate),
    taxRatePercent: quotation.taxRatePercent,
    status: quotation.status,
    items: quotation.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountPercent: item.discountPercent,
    })),
  };
}

export default function QuotationsSettingsPage() {
  const { session, activeOrganization } = useAppSession();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sort, setSort] = useState<SortOrder>('desc');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuotationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuotationRecord | null>(null);
  const [form, setForm] = useState<QuotationDialogFormValues>(defaultForm);
  const [dialogError, setDialogError] = useState('');

  const canLoad = Boolean(session.token && session.organizationId);

  const requestOptions = useMemo(
    () => ({
      token: session.token,
      baseUrl: session.baseUrl,
    }),
    [session.baseUrl, session.token],
  );

  const contactNameById = useMemo(() => {
    return new Map(
      contacts.map((contact) => [
        contact.id,
        `${contact.firstName} ${contact.lastName ?? ''}`.trim(),
      ]),
    );
  }, [contacts]);

  const eventTitleById = useMemo(() => {
    return new Map(events.map((event) => [event.id, event.title]));
  }, [events]);

  async function loadPageData() {
    if (!canLoad || !session.organizationId) {
      setQuotations([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [quotationsResponse, contactsResponse, eventsResponse] = await Promise.all([
        listQuotations(requestOptions, {
          organizationId: session.organizationId,
          page: 1,
          limit: 200,
          status: statusFilter,
          search,
          sortBy,
          sort,
          includeArchived: false,
        }),
        listContacts(requestOptions, session.organizationId),
        listEvents(requestOptions, session.organizationId),
      ]);

      setQuotations(quotationsResponse.data);
      setContacts(contactsResponse.data);
      setEvents(eventsResponse.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load quotations.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, session.organizationId, statusFilter, sortBy, sort]);

  async function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPageData();
  }

  function validateForm(values: QuotationDialogFormValues) {
    if (!values.contactId) {
      return 'Contact is required.';
    }

    if (!values.title.trim()) {
      return 'Quotation title is required.';
    }

    if (values.items.length === 0) {
      return 'Add at least one item.';
    }

    for (const item of values.items) {
      if (!item.description.trim()) {
        return 'Each item needs a description.';
      }

      if (item.quantity < 1) {
        return 'Item quantity must be at least 1.';
      }

      if (item.unitPriceCents < 0) {
        return 'Item unit price cannot be negative.';
      }

      if ((item.discountPercent ?? 0) < 0 || (item.discountPercent ?? 0) > 100) {
        return 'Line item discount must be between 0 and 100 percent.';
      }

      if (values.taxRatePercent < 0 || values.taxRatePercent > 100) {
        return 'VAT must be between 0 and 100 percent.';
      }
    }

    return '';
  }

  async function handleCreateSave() {
    if (!session.organizationId) {
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setDialogError(validationError);
      return;
    }

    setBusyAction('create');
    setDialogError('');
    setError('');

    try {
      const created = await createQuotation(
        requestOptions,
        toCreatePayload(form, session.organizationId),
      );

      setQuotations((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm(defaultForm);
      setSuccess('Quotation created successfully.');
    } catch (requestError) {
      setDialogError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create quotation.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEditSave() {
    if (!editTarget) {
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setDialogError(validationError);
      return;
    }

    setBusyAction('edit');
    setBusyId(editTarget.id);
    setDialogError('');
    setError('');

    try {
      const updated = await updateQuotation(
        requestOptions,
        editTarget.id,
        toEditPayload(form),
      );

      setQuotations((prev) =>
        prev.map((candidate) =>
          candidate.id === updated.id ? updated : candidate,
        ),
      );
      setEditTarget(null);
      setSuccess('Quotation updated successfully.');
    } catch (requestError) {
      setDialogError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update quotation.',
      );
    } finally {
      setBusyAction(null);
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setBusyAction('delete');
    setBusyId(deleteTarget.id);
    setError('');

    try {
      await deleteQuotation(requestOptions, deleteTarget.id);
      setQuotations((prev) =>
        prev.filter((candidate) => candidate.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setSuccess('Quotation deleted successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to delete quotation.',
      );
    } finally {
      setBusyAction(null);
      setBusyId(null);
    }
  }

  async function handleStatusChange(id: string, status: QuotationStatus) {
    setBusyAction('status');
    setBusyId(id);
    setError('');

    try {
      const updated = await updateQuotationStatus(requestOptions, id, status);
      setQuotations((prev) =>
        prev.map((candidate) =>
          candidate.id === updated.id ? updated : candidate,
        ),
      );
      setSuccess('Quotation status updated.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update quotation status.',
      );
    } finally {
      setBusyAction(null);
      setBusyId(null);
    }
  }

  const showEmpty = canLoad && !loading && quotations.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title="Quotations"
        description="Create, track and cost quotations for your active organization."
        actions={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => {
              setDialogError('');
              setForm(defaultForm);
              setCreateOpen(true);
            }}
            disabled={!canLoad}
          >
            New Quotation
          </button>
        }
      />

      {!canLoad ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Sign in and select an organization to manage quotations.
        </div>
      ) : null}

      <form
        onSubmit={applySearch}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-5"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search number, title or notes"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as QuotationStatus | 'ALL')}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortBy)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="createdAt">Sort by Created</option>
          <option value="updatedAt">Sort by Updated</option>
          <option value="totalCents">Sort by Total</option>
          <option value="quoteNumber">Sort by Number</option>
        </select>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>

        <div className="md:col-span-5">
          <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
            <span>Order:</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      </form>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading quotations...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No quotations configured for {activeOrganization?.name ?? 'this organization'}.
        </div>
      ) : null}

      {canLoad && !loading && quotations.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">
                      Quotation Number
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Event</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Subtotal</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">VAT</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Valid Until</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation) => {
                    const rowBusy = busyId === quotation.id;
                    return (
                      <tr key={quotation.id} className="border-t border-zinc-200">
                        <td className="px-4 py-3 text-zinc-900">{quotation.quoteNumber}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {contactNameById.get(quotation.contactId) ?? quotation.contactId}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {quotation.eventId
                            ? (eventTitleById.get(quotation.eventId) ?? quotation.eventId)
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={statusPillClasses(quotation.status)}>
                            {quotation.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {formatCurrency(quotation.subtotalCents)}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {formatCurrency(quotation.taxCents)}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {formatCurrency(quotation.totalCents)}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {quotation.validUntil
                            ? new Date(quotation.validUntil).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/quotations/${quotation.id}`}
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                              aria-disabled={rowBusy}
                            >
                              View
                            </Link>

                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                              onClick={() => {
                                setDialogError('');
                                setForm(quotationToForm(quotation));
                                setEditTarget(quotation);
                              }}
                              disabled={rowBusy}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(quotation)}
                              disabled={rowBusy}
                            >
                              Delete
                            </button>

                            <select
                              aria-label={`Status for ${quotation.quoteNumber}`}
                              className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                              value={quotation.status}
                              onChange={(event) =>
                                void handleStatusChange(
                                  quotation.id,
                                  event.target.value as QuotationStatus,
                                )
                              }
                              disabled={rowBusy}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Expired">Expired</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {quotations.map((quotation) => {
              const rowBusy = busyId === quotation.id;
              return (
                <article key={quotation.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{quotation.quoteNumber}</p>
                      <p className="text-xs text-zinc-600">{quotation.title}</p>
                    </div>
                    <span className={statusPillClasses(quotation.status)}>{quotation.status}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    <p>Client</p>
                    <p className="text-right text-zinc-800">
                      {contactNameById.get(quotation.contactId) ?? quotation.contactId}
                    </p>
                    <p>Event</p>
                    <p className="text-right text-zinc-800">
                      {quotation.eventId
                        ? (eventTitleById.get(quotation.eventId) ?? quotation.eventId)
                        : '-'}
                    </p>
                    <p>Subtotal</p>
                    <p className="text-right text-zinc-800">
                      {formatCurrency(quotation.subtotalCents)}
                    </p>
                    <p>VAT</p>
                    <p className="text-right text-zinc-800">{formatCurrency(quotation.taxCents)}</p>
                    <p>Total</p>
                    <p className="text-right font-semibold text-zinc-900">
                      {formatCurrency(quotation.totalCents)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/quotations/${quotation.id}`}
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      aria-disabled={rowBusy}
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      onClick={() => {
                        setDialogError('');
                        setForm(quotationToForm(quotation));
                        setEditTarget(quotation);
                      }}
                      disabled={rowBusy}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(quotation)}
                      disabled={rowBusy}
                    >
                      Delete
                    </button>

                    <select
                      aria-label={`Status for ${quotation.quoteNumber}`}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      value={quotation.status}
                      onChange={(event) =>
                        void handleStatusChange(
                          quotation.id,
                          event.target.value as QuotationStatus,
                        )
                      }
                      disabled={rowBusy}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      {createOpen ? (
        <QuotationDialogForm
          mode="create"
          values={form}
          contacts={contacts}
          events={events}
          busy={busyAction === 'create'}
          error={dialogError}
          onClose={() => setCreateOpen(false)}
          onSave={() => void handleCreateSave()}
          onChange={setForm}
        />
      ) : null}

      {editTarget ? (
        <QuotationDialogForm
          mode="edit"
          values={form}
          contacts={contacts}
          events={events}
          busy={busyAction === 'edit' && busyId === editTarget.id}
          error={dialogError}
          onClose={() => setEditTarget(null)}
          onSave={() => void handleEditSave()}
          onChange={setForm}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteQuotationDialog
          quotation={deleteTarget}
          busy={busyAction === 'delete' && busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}

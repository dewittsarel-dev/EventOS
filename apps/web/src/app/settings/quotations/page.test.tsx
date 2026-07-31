import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuotationsSettingsPage from './page';

const listQuotations = vi.fn();
const listContacts = vi.fn();
const listEvents = vi.fn();
const createQuotation = vi.fn();
const updateQuotation = vi.fn();
const updateQuotationStatus = vi.fn();
const deleteQuotation = vi.fn();

vi.mock('../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
    activeOrganization: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS',
      slug: 'eventos',
    },
  }),
}));

vi.mock('../../../lib/quotations-api', () => ({
  listQuotations: (...args: unknown[]) => listQuotations(...args),
  listContacts: (...args: unknown[]) => listContacts(...args),
  listEvents: (...args: unknown[]) => listEvents(...args),
  createQuotation: (...args: unknown[]) => createQuotation(...args),
  updateQuotation: (...args: unknown[]) => updateQuotation(...args),
  updateQuotationStatus: (...args: unknown[]) => updateQuotationStatus(...args),
  deleteQuotation: (...args: unknown[]) => deleteQuotation(...args),
}));

const quotations = [
  {
    id: 'q-1',
    quoteNumber: 'QUO-0001',
    quotationNumber: 'QUO-0001',
    organizationId: '11111111-1111-4111-8111-111111111111',
    contactId: 'c-1',
    eventId: 'e-1',
    title: 'Platinum Package',
    notes: null,
    status: 'Draft',
    issueDate: '2026-07-30T00:00:00.000Z',
    expiryDate: '2026-08-15T00:00:00.000Z',
    validUntil: '2026-08-15T00:00:00.000Z',
    subtotalCents: 100000,
    subtotal: 100000,
    discountCents: 0,
    taxRatePercent: 15,
    taxCents: 15000,
    vat: 15000,
    totalCents: 115000,
    total: 115000,
    archivedAt: null,
    createdAt: '2026-07-30T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    items: [
      {
        id: 'qi-1',
        quotationId: 'q-1',
        description: 'Venue',
        quantity: 1,
        unitPriceCents: 100000,
        discountCents: 0,
        lineTotalCents: 100000,
        unitPrice: 100000,
        discount: 0,
        total: 100000,
        sortOrder: 0,
        createdAt: '2026-07-30T00:00:00.000Z',
        updatedAt: '2026-07-30T00:00:00.000Z',
      },
    ],
  },
] as const;

describe('QuotationsSettingsPage', () => {
  beforeEach(() => {
    listQuotations.mockReset();
    listContacts.mockReset();
    listEvents.mockReset();
    createQuotation.mockReset();
    updateQuotation.mockReset();
    updateQuotationStatus.mockReset();
    deleteQuotation.mockReset();

    listQuotations.mockResolvedValue({
      data: quotations,
      meta: { page: 1, limit: 200, total: 1 },
    });

    listContacts.mockResolvedValue({
      data: [
        {
          id: 'c-1',
          organizationId: '11111111-1111-4111-8111-111111111111',
          firstName: 'Alice',
          lastName: 'Stone',
        },
      ],
    });

    listEvents.mockResolvedValue({
      data: [
        {
          id: 'e-1',
          organizationId: '11111111-1111-4111-8111-111111111111',
          title: 'Launch Event',
        },
      ],
      meta: { page: 1, limit: 100, total: 1 },
    });

    createQuotation.mockResolvedValue({
      ...quotations[0],
      id: 'q-2',
      quoteNumber: 'QUO-0002',
      quotationNumber: 'QUO-0002',
    });
    updateQuotation.mockResolvedValue(quotations[0]);
    updateQuotationStatus.mockResolvedValue({
      ...quotations[0],
      status: 'Sent',
    });
    deleteQuotation.mockResolvedValue(undefined);
  });

  it('renders required quotations columns', async () => {
    render(<QuotationsSettingsPage />);

    expect(await screen.findByText('Quotation Number')).toBeInTheDocument();
    expect(screen.getAllByText('Client').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Subtotal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VAT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
  });

  it('creates quotation from dialog', async () => {
    render(<QuotationsSettingsPage />);
    expect((await screen.findAllByText('QUO-0001')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'New Quotation' }));

    const dialog = screen.getByRole('dialog', { name: 'Create Quotation' });
    fireEvent.change(within(dialog).getByLabelText('Contact'), {
      target: { value: 'c-1' },
    });
    fireEvent.change(within(dialog).getByLabelText('Event'), {
      target: { value: 'e-1' },
    });
    fireEvent.change(within(dialog).getByLabelText('Quotation Title'), {
      target: { value: 'Starter Package' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('Description'), {
      target: { value: 'Consulting' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Quotation' }));

    await waitFor(() => {
      expect(createQuotation).toHaveBeenCalledTimes(1);
    });
  });

  it('updates status and deletes quotation', async () => {
    render(<QuotationsSettingsPage />);
    expect((await screen.findAllByText('QUO-0001')).length).toBeGreaterThan(0);

    fireEvent.change(screen.getAllByLabelText('Status for QUO-0001')[0], {
      target: { value: 'Sent' },
    });

    await waitFor(() => {
      expect(updateQuotationStatus).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    const deleteDialog = screen.getByRole('dialog', { name: 'Confirm Delete' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete Quotation' }));

    await waitFor(() => {
      expect(deleteQuotation).toHaveBeenCalledTimes(1);
    });
  });
});

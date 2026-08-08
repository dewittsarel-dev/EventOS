import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommercialWorkspacePage from './page';

const listProcurementPackages = vi.fn();
const listCommercialWorkspaces = vi.fn();

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));
vi.mock('../../../../components/app-shell/session-context', () => ({ useAppSession: () => ({ session: { token: 'token-1', baseUrl: 'http://localhost:3001' } }) }));
vi.mock('../../../../lib/procurement-api', () => ({ listProcurementPackages: (...args: unknown[]) => listProcurementPackages(...args) }));
vi.mock('../../../../lib/commercial-api', () => ({
  listCommercialWorkspaces: (...args: unknown[]) => listCommercialWorkspaces(...args),
  generateCommercialWorkspace: vi.fn(), approveCommercialRfq: vi.fn(), sendCommercialRfq: vi.fn(), submitCommercialQuote: vi.fn(), compareCommercialQuotes: vi.fn(), reviewCommercialSubstitution: vi.fn(), createCommercialAwards: vi.fn(), prepareCommercialPurchaseOrderDrafts: vi.fn(), approveCommercialPurchaseOrderDraft: vi.fn(),
}));

describe('CommercialWorkspacePage', () => {
  beforeEach(() => {
    listProcurementPackages.mockResolvedValue([]);
    listCommercialWorkspaces.mockResolvedValue([{
      id: 'workspace-1', status: 'Draft', procurementPackageId: 'package-1', createdAt: '2026-08-08T00:00:00.000Z',
      procurementPackage: { name: 'Furniture Package' }, procurementSolution: {},
      rfqs: [{ id: 'rfq-1', supplierId: 'supplier-1', supplierName: 'Chair Company', status: 'Draft', title: 'Furniture', eventSummary: 'Wedding', submissionDeadline: '2026-09-01T12:00:00.000Z', deliveryDate: null, collectionDate: null, venue: null, specialNotes: null, approvedAt: null, sentAt: null, lines: [{ id: 'line-1', requirementItemId: 'item-1', description: 'Tiffany chairs', quantity: 100, unit: 'each', notes: null }] }],
      messages: [], quotes: [], awards: [], purchaseOrderDrafts: [],
    }]);
  });

  it('shows a governed RFQ conversation and separate approval action', async () => {
    render(<CommercialWorkspacePage />);
    expect(await screen.findByText('Furniture Package')).toBeInTheDocument();
    expect(screen.getByText('Chair Company')).toBeInTheDocument();
    expect(screen.getByText(/Tiffany chairs/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve RFQ' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send approved RFQ' })).not.toBeInTheDocument();
    expect(screen.getByText('Humans approve')).toBeInTheDocument();
  });
});


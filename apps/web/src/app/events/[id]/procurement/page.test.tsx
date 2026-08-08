import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProcurementStudioPage from './page';

const listRequirementSets = vi.fn();
const listProcurementPackages = vi.fn();

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));
vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({ session: { token: 'token-1', baseUrl: 'http://localhost:3001' } }),
}));
vi.mock('../../../../lib/event-planning-api', () => ({
  listRequirementSets: (...args: unknown[]) => listRequirementSets(...args),
}));
vi.mock('../../../../lib/procurement-api', () => ({
  listProcurementPackages: (...args: unknown[]) => listProcurementPackages(...args),
  createProcurementPackage: vi.fn(),
  analyseProcurementPackage: vi.fn(),
  selectProcurementSolution: vi.fn(),
  requestProcurementQuotations: vi.fn(),
}));

describe('ProcurementStudioPage', () => {
  beforeEach(() => {
    listRequirementSets.mockReset();
    listProcurementPackages.mockReset();
    listRequirementSets.mockResolvedValue([]);
    listProcurementPackages.mockResolvedValue([
      {
        id: 'package-1',
        requirementSetId: 'set-1',
        name: 'Furniture Package',
        category: 'Furniture',
        status: 'Analysed',
        policy: {
          minimiseCost: true,
          minimiseSuppliers: false,
          supportEmergingBusinesses: false,
          preferLocalSuppliers: true,
          environmentalPreference: false,
          preferExistingRelationships: false,
          balancedMarketplace: true,
          minimumReliabilityPercent: 80,
          maximumSuppliersPerPackage: 2,
        },
        quotationRequestedAt: null,
        createdAt: '2026-08-08T00:00:00.000Z',
        items: [{ requirementItemId: 'item-1', requirementItem: { id: 'item-1' } }],
        solutions: [
          {
            id: 'solution-1',
            rank: 1,
            strategy: 'Balanced',
            label: 'Solution 1',
            estimatedTotalCost: 101500,
            currency: 'ZAR',
            confidenceScore: 94,
            riskScore: 8,
            supplierCount: 2,
            explanation: 'Shown because it matches the explicit buyer policy.',
            tradeOffs: { noHiddenObjective: true },
            selectedAt: null,
            allocations: [{ id: 'allocation-1', supplierName: 'Local Supplier', quantity: 120, deliveryCapability: 'Full delivery' }],
          },
        ],
      },
    ]);
  });

  it('shows explicit policies, explainable alternatives and human selection', async () => {
    render(<ProcurementStudioPage />);

    expect(await screen.findByText('Furniture Package')).toBeInTheDocument();
    expect(screen.getByText('Visible choice')).toBeInTheDocument();
    expect(screen.getAllByText('Marketplace diversity').length).toBeGreaterThan(0);
    expect(screen.getByText('Shown because it matches the explicit buyer policy.')).toBeInTheDocument();
    expect(screen.getByText(/Local Supplier/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select this strategy' })).toBeInTheDocument();
  });
});

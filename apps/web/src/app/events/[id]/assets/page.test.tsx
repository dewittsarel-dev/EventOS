import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventAssetsPage from './page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));
vi.mock('../../../../components/app-shell/session-context', () => ({ useAppSession: () => ({ session: { token: 'token-1', baseUrl: 'http://localhost:3001' } }) }));
vi.mock('../../../../lib/events-api', () => ({ getEvent: vi.fn().mockResolvedValue({ id: 'event-1', organizationId: 'org-1', startDateTime: '2026-09-01T08:00:00Z', endDateTime: '2026-09-01T18:00:00Z' }) }));
vi.mock('../../../../lib/event-planning-api', () => ({ listRequirementSets: vi.fn().mockResolvedValue([{ status: 'Approved', items: [{ id: 'item-1', requirementCode: 'REQ-001', name: 'Tiffany chairs' }] }]) }));
vi.mock('../../../../lib/asset-management-api', () => ({ searchAssets: vi.fn().mockResolvedValue({ definitions: [{ id: 'asset-1', assetDefinitionId: 'AST-DEF-00000001', assetCode: 'CHAIR-01', name: 'Gold Tiffany Chair', category: 'Furniture', ownershipType: 'BusinessOwned', trackingMode: 'Quantity', unitOfMeasure: 'each', quantityOnHand: 150, quantityUnavailable: 20, capabilityTags: [], active: true }], instances: [] }), getAssetGovernanceSummary: vi.fn().mockResolvedValue({ definitions: 1, instances: [], reservations: [], incidents: [], maintenance: [], unresolvedGovernanceExceptions: 0 }), createAssetReservation: vi.fn(), createAssetOperation: vi.fn(), recordAssetDeployment: vi.fn(), recordAssetInspection: vi.fn(), createAssetIncident: vi.fn() }));

describe('EventAssetsPage', () => { it('shows availability separately and governed event actions', async () => { render(<EventAssetsPage />); expect(await screen.findByText('Gold Tiffany Chair')).toBeInTheDocument(); expect(screen.getByText('130')).toBeInTheDocument(); expect(screen.getByRole('option', { name: /Tiffany chairs/ })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Record controlled asset action' })).toBeInTheDocument(); }); });

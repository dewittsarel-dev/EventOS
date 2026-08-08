import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventPlanningPage from './page';

const listClientBriefs = vi.fn();
const listEventDesigns = vi.fn();
const listRequirementSets = vi.fn();
const listRequirementImpactReports = vi.fn();

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));

vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: 'organization-1',
    },
  }),
}));

vi.mock('../../../../lib/event-planning-api', () => ({
  listClientBriefs: (...args: unknown[]) => listClientBriefs(...args),
  listEventDesigns: (...args: unknown[]) => listEventDesigns(...args),
  listRequirementSets: (...args: unknown[]) => listRequirementSets(...args),
  listRequirementImpactReports: (...args: unknown[]) => listRequirementImpactReports(...args),
  createClientBrief: vi.fn(),
  createEventDesign: vi.fn(),
  createRequirementSet: vi.fn(),
  approveEventDesign: vi.fn(),
  approveRequirementSet: vi.fn(),
}));

describe('EventPlanningPage', () => {
  beforeEach(() => {
    listClientBriefs.mockResolvedValue([
      {
        id: 'brief-1',
        version: 2,
        clientName: 'Lara Croft',
        eventName: 'Gamma Expo',
        eventType: 'Expo',
      },
    ]);
    listEventDesigns.mockResolvedValue([
      { id: 'design-1', version: 1, status: 'Approved' },
    ]);
    listRequirementSets.mockResolvedValue([
      {
        id: 'set-1',
        version: 1,
        status: 'Draft',
        items: [{ id: 'item-1' }],
      },
    ]);
    listRequirementImpactReports.mockResolvedValue([]);
  });

  it('shows the versioned brief, design, and requirement workflow', async () => {
    render(<EventPlanningPage />);

    expect(await screen.findAllByText('Version 2 · Gamma Expo')).toHaveLength(2);
    expect(screen.getByText('Version 1 · 1 requirements')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve version' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Create Requirement Set' })).toBeEnabled();
  });
});

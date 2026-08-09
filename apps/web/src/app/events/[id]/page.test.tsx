import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventDetailsPage from './page';

const getEvent = vi.fn();
const getEventLifecycle = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'event-1' }),
}));

vi.mock('../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../../lib/events-api', () => ({
  getEvent: (...args: unknown[]) => getEvent(...args),
}));

vi.mock('../../../lib/event-lifecycle-api', () => ({
  getEventLifecycle: (...args: unknown[]) => getEventLifecycle(...args),
  synchronizeEventLifecycle: vi.fn(),
}));

describe('EventDetailsPage', () => {
  beforeEach(() => {
    getEvent.mockReset();
    getEventLifecycle.mockReset();
    getEventLifecycle.mockResolvedValue({
      eventId: 'event-1',
      health: 'NeedsAttention',
      currentStage: 'Design',
      nextAction: {
        label: 'Continue planning',
        reason: 'Approved Requirement Set missing',
        actionType: 'OpenPlanningWorkspace',
      },
      chain: {
        brief: { id: 'brief-1', version: 1 },
        design: { id: 'design-1', version: 1, status: 'Approved' },
        requirementSet: null,
        moodBoard: null,
        procurementPackages: [],
        commercialWorkspaces: [],
        assetReservations: 0,
        execution: null,
        finance: null,
      },
      blockers: ['Approved Requirement Set missing'],
      executionReady: false,
      sourceOwnership: {},
    });
    getEvent.mockResolvedValue({
      id: 'event-1',
      organizationId: '11111111-1111-4111-8111-111111111111',
      contactId: 'contact-1',
      contactName: 'Lara Croft',
      assignedUserId: 'user-1',
      assignedUserName: 'Alice Admin',
      title: 'Gamma Expo',
      eventType: 'Expo',
      eventDate: '2026-12-20T00:00:00.000Z',
      startTime: '08:00',
      endTime: '18:00',
      venue: 'Durban ICC',
      budgetCents: 450000,
      notes: 'Important',
      description: 'Important',
      startDateTime: '2026-12-20T08:00:00.000Z',
      endDateTime: '2026-12-20T18:00:00.000Z',
      location: 'Durban ICC',
      status: 'Planned',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });
  });

  it('renders event details fields', async () => {
    render(<EventDetailsPage />);

    expect(await screen.findByText('Gamma Expo')).toBeInTheDocument();
    expect(screen.getByText('Lara Croft')).toBeInTheDocument();
    expect(screen.getByText('Expo')).toBeInTheDocument();
    expect(screen.getByText('Durban ICC')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(await screen.findByText('Event lifecycle')).toBeInTheDocument();
    expect(await screen.findAllByText('Approved Requirement Set missing')).toHaveLength(2);
    expect(screen.getByText('Current stage')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue planning' })).toHaveAttribute(
      'href',
      '/events/event-1/planning',
    );
    expect(screen.getByRole('link', { name: 'Mood Board' })).toHaveAttribute(
      'href',
      '/events/event-1/mood-board',
    );
    expect(screen.getByRole('link', { name: 'Procurement' })).toHaveAttribute(
      'href',
      '/events/event-1/procurement',
    );
    expect(screen.getByRole('link', { name: 'Commercial' })).toHaveAttribute(
      'href',
      '/events/event-1/commercial',
    );
    expect(screen.getByRole('link', { name: 'Assets' })).toHaveAttribute('href', '/events/event-1/assets');
    expect(screen.getByRole('link', { name: 'Execution' })).toHaveAttribute('href', '/events/event-1/execution');
    expect(screen.getByRole('link', { name: 'Finance' })).toHaveAttribute('href', '/events/event-1/finance');
  });

  it('routes procurement blockers directly to Procurement Studio', async () => {
    getEventLifecycle.mockResolvedValue({
      eventId: 'event-1', health: 'NeedsAttention', currentStage: 'Procurement',
      nextAction: { label: 'Open Procurement', reason: 'Procurement Package without selected solution', actionType: 'OpenProcurement' },
      chain: { brief: { id: 'brief-1', version: 1 }, design: { id: 'design-1', version: 1, status: 'Approved' }, requirementSet: { id: 'set-1', version: 1, status: 'Approved' }, moodBoard: { id: 'board-1', version: 1, status: 'Approved' }, procurementPackages: [{ id: 'package-1', status: 'Draft', solutions: [] }], commercialWorkspaces: [], assetReservations: 0, execution: null, finance: null },
      blockers: ['Procurement Package without selected solution'], executionReady: false, sourceOwnership: {},
    });

    render(<EventDetailsPage />);

    expect(await screen.findByRole('link', { name: 'Open Procurement' })).toHaveAttribute('href', '/events/event-1/procurement');
  });

  it('shows a completed lifecycle without offering further synchronization', async () => {
    getEventLifecycle.mockResolvedValue({
      eventId: 'event-1', health: 'OnTrack', currentStage: 'Closed',
      nextAction: { label: 'Lifecycle complete', reason: 'Operational execution and event finance are closed.', actionType: 'LifecycleComplete' },
      chain: { brief: { id: 'brief-1', version: 1 }, design: { id: 'design-1', version: 1, status: 'Approved' }, requirementSet: { id: 'set-1', version: 1, status: 'Approved' }, moodBoard: { id: 'board-1', version: 1, status: 'Approved' }, procurementPackages: [], commercialWorkspaces: [], assetReservations: 1, execution: { id: 'execution-1', status: 'Completed', executionPlanVersion: 1 }, finance: { id: 'finance-1', status: 'Closed' } },
      blockers: [], executionReady: false, lifecycleComplete: true, sourceOwnership: {},
    });

    render(<EventDetailsPage />);

    expect(await screen.findByText('Operational execution and event finance are closed. The lifecycle is complete.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Synchronize approved work' })).not.toBeInTheDocument();
  });
});

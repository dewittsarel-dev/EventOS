import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventDetailsPage from './page';

const getEvent = vi.fn();

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

describe('EventDetailsPage', () => {
  beforeEach(() => {
    getEvent.mockReset();
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
  });
});

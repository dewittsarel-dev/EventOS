import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventsPage from './page';

const listEvents = vi.fn();
const deleteEvent = vi.fn();

vi.mock('../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../lib/events-api', () => ({
  listEvents: (...args: unknown[]) => listEvents(...args),
  deleteEvent: (...args: unknown[]) => deleteEvent(...args),
}));

describe('EventsPage', () => {
  beforeEach(() => {
    listEvents.mockReset();
    deleteEvent.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));

    listEvents.mockResolvedValue({
      data: [
        {
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
        },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    });
    deleteEvent.mockResolvedValue(undefined);
  });

  it('renders event grid and supports search/filter', async () => {
    render(<EventsPage />);

    expect(await screen.findByText('Event Name')).toBeInTheDocument();
    expect(screen.getByText('Gamma Expo')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search name, type or venue'), {
      target: { value: 'Gamma' },
    });
    fireEvent.change(screen.getByPlaceholderText('Filter event type'), {
      target: { value: 'Expo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(listEvents).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          search: 'Gamma',
          eventType: 'Expo',
        }),
      );
    });
  });

  it('deletes an event', async () => {
    render(<EventsPage />);

    await screen.findByText('Gamma Expo');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteEvent).toHaveBeenCalledWith(expect.anything(), 'event-1');
    });
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditEventPage from './page';

const getEvent = vi.fn();
const listContacts = vi.fn();
const listOrganizationUsers = vi.fn();
const updateEvent = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'event-1' }),
  useRouter: () => ({ push }),
}));

vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
  }),
}));

vi.mock('../../../../lib/events-api', () => ({
  getEvent: (...args: unknown[]) => getEvent(...args),
  listContacts: (...args: unknown[]) => listContacts(...args),
  listOrganizationUsers: (...args: unknown[]) => listOrganizationUsers(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}));

describe('EditEventPage', () => {
  beforeEach(() => {
    getEvent.mockReset();
    listContacts.mockReset();
    listOrganizationUsers.mockReset();
    updateEvent.mockReset();
    push.mockReset();

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

    listContacts.mockResolvedValue({
      data: [
        {
          id: 'contact-1',
          organizationId: '11111111-1111-4111-8111-111111111111',
          firstName: 'Lara',
          lastName: 'Croft',
          email: 'lara@example.com',
          phone: null,
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });

    listOrganizationUsers.mockResolvedValue({
      data: [
        {
          membershipId: 'm-1',
          userId: 'user-1',
          name: 'Alice Admin',
          email: 'alice@example.com',
          role: 'owner',
          status: 'Active',
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });

    updateEvent.mockResolvedValue({ id: 'event-1' });
  });

  it('updates an event', async () => {
    render(<EditEventPage />);

    await screen.findByDisplayValue('Gamma Expo');

    fireEvent.change(screen.getByLabelText('Event Name'), {
      target: { value: 'Gamma Expo Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        expect.anything(),
        'event-1',
        expect.objectContaining({ title: 'Gamma Expo Updated' }),
      );
    });

    expect(push).toHaveBeenCalledWith('/events/event-1');
  });

  it('still loads event data when organization users request fails', async () => {
    listOrganizationUsers.mockRejectedValueOnce(new Error('Invalid role value'));

    render(<EditEventPage />);

    expect(await screen.findByDisplayValue('Gamma Expo')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Durban ICC')).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });
});

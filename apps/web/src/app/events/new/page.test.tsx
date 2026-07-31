import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewEventPage from './page';

const listContacts = vi.fn();
const listOrganizationUsers = vi.fn();
const createEvent = vi.fn();

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
  listContacts: (...args: unknown[]) => listContacts(...args),
  listOrganizationUsers: (...args: unknown[]) => listOrganizationUsers(...args),
  createEvent: (...args: unknown[]) => createEvent(...args),
}));

describe('NewEventPage', () => {
  beforeEach(() => {
    listContacts.mockReset();
    listOrganizationUsers.mockReset();
    createEvent.mockReset();

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

    createEvent.mockResolvedValue({ id: 'event-1' });
  });

  it('creates an event with required fields', async () => {
    render(<NewEventPage />);

    await screen.findByRole('option', { name: 'Lara Croft' });

    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'contact-1' } });
    fireEvent.change(screen.getByLabelText('Assigned User'), { target: { value: 'user-1' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Gamma Expo' } });
    fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: 'Expo' } });
    fireEvent.change(screen.getByLabelText('Event Date'), { target: { value: '2026-12-20' } });
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('Venue'), { target: { value: 'Durban ICC' } });
    fireEvent.change(screen.getByLabelText('Budget (in currency units)'), {
      target: { value: '4500.00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }));

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledTimes(1);
    });
  });
});

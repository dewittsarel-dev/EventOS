import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './page';

const listOrganizationUsers = vi.fn();
const inviteOrganizationUser = vi.fn();
const updateOrganizationUser = vi.fn();
const disableOrganizationUser = vi.fn();
const enableOrganizationUser = vi.fn();
const deleteOrganizationUser = vi.fn();

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

vi.mock('../../../lib/organization-users-api', () => ({
  listOrganizationUsers: (...args: unknown[]) => listOrganizationUsers(...args),
  inviteOrganizationUser: (...args: unknown[]) => inviteOrganizationUser(...args),
  updateOrganizationUser: (...args: unknown[]) => updateOrganizationUser(...args),
  disableOrganizationUser: (...args: unknown[]) => disableOrganizationUser(...args),
  enableOrganizationUser: (...args: unknown[]) => enableOrganizationUser(...args),
  deleteOrganizationUser: (...args: unknown[]) => deleteOrganizationUser(...args),
}));

describe('UsersPage', () => {
  beforeEach(() => {
    listOrganizationUsers.mockReset();
    inviteOrganizationUser.mockReset();
    updateOrganizationUser.mockReset();
    disableOrganizationUser.mockReset();
    enableOrganizationUser.mockReset();
    deleteOrganizationUser.mockReset();

    listOrganizationUsers.mockResolvedValue({
      data: [
        {
          membershipId: 'membership-1',
          userId: 'user-1',
          name: 'Avery Stone',
          email: 'avery@example.com',
          role: 'Manager',
          status: 'Active',
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });

    inviteOrganizationUser.mockResolvedValue({
      membershipId: 'membership-2',
      userId: 'user-2',
      name: 'Casey Lane',
      email: 'casey@example.com',
      role: 'Staff',
      status: 'Active',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    updateOrganizationUser.mockResolvedValue({
      membershipId: 'membership-1',
      userId: 'user-1',
      name: 'Avery Updated',
      email: 'avery.updated@example.com',
      role: 'Administrator',
      status: 'Active',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    disableOrganizationUser.mockResolvedValue({
      membershipId: 'membership-1',
      userId: 'user-1',
      name: 'Avery Stone',
      email: 'avery@example.com',
      role: 'Manager',
      status: 'Disabled',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    enableOrganizationUser.mockResolvedValue({
      membershipId: 'membership-1',
      userId: 'user-1',
      name: 'Avery Stone',
      email: 'avery@example.com',
      role: 'Manager',
      status: 'Active',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    deleteOrganizationUser.mockResolvedValue(undefined);
  });

  it('loads and displays organization users', async () => {
    render(<UsersPage />);

    expect((await screen.findAllByText('Avery Stone')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('avery@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('invites a user through the invite dialog', async () => {
    render(<UsersPage />);

    await screen.findAllByText('Avery Stone');

    fireEvent.click(screen.getByRole('button', { name: 'Invite User' }));

    const dialog = screen.getByRole('dialog', { name: 'Invite User' });

    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Casey Lane' },
    });
    fireEvent.change(within(dialog).getByLabelText('Email'), {
      target: { value: 'casey@example.com' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Invite User' }));

    await waitFor(() => {
      expect(inviteOrganizationUser).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('User invited successfully.')).toBeInTheDocument();
  });

  it('supports edit, disable, enable, and delete actions', async () => {
    render(<UsersPage />);

    await screen.findAllByText('Avery Stone');

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit User' })[0]);

    const editDialog = screen.getByRole('dialog', { name: 'Edit User' });
    fireEvent.change(within(editDialog).getByLabelText('Name'), {
      target: { value: 'Avery Updated' },
    });
    fireEvent.change(within(editDialog).getByLabelText('Email'), {
      target: { value: 'avery.updated@example.com' },
    });
    fireEvent.change(within(editDialog).getByLabelText('Role'), {
      target: { value: 'Administrator' },
    });

    fireEvent.click(within(editDialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateOrganizationUser).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Disable User' })[0]);

    await waitFor(() => {
      expect(disableOrganizationUser).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Enable User' })[0]);

    await waitFor(() => {
      expect(enableOrganizationUser).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete User' })[0]);

    const deleteDialog = screen.getByRole('dialog', { name: 'Confirm Delete' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete User' }));

    await waitFor(() => {
      expect(deleteOrganizationUser).toHaveBeenCalledTimes(1);
    });
  });
});

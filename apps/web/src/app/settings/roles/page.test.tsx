import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RolesPage from './page';
import { emptyPermissions } from '../../../lib/roles-types';

const listRoles = vi.fn();
const createRole = vi.fn();
const updateRole = vi.fn();
const deleteRole = vi.fn();

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

vi.mock('../../../lib/roles-api', () => ({
  listRoles: (...args: unknown[]) => listRoles(...args),
  createRole: (...args: unknown[]) => createRole(...args),
  updateRole: (...args: unknown[]) => updateRole(...args),
  deleteRole: (...args: unknown[]) => deleteRole(...args),
}));

describe('RolesPage', () => {
  beforeEach(() => {
    listRoles.mockReset();
    createRole.mockReset();
    updateRole.mockReset();
    deleteRole.mockReset();

    listRoles.mockResolvedValue({
      data: [
        {
          id: 'role-1',
          organizationId: 'org-1',
          name: 'Administrator',
          description: 'System role',
          userCount: 1,
          isSystem: true,
          permissions: emptyPermissions(),
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
        {
          id: 'role-2',
          organizationId: 'org-1',
          name: 'Field Coordinator',
          description: 'Coordinates field execution',
          userCount: 0,
          isSystem: false,
          permissions: emptyPermissions(),
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });

    createRole.mockResolvedValue({
      id: 'role-3',
      organizationId: 'org-1',
      name: 'Support Lead',
      description: 'Supports event operations',
      userCount: 0,
      isSystem: false,
      permissions: emptyPermissions(),
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    updateRole.mockResolvedValue({
      id: 'role-2',
      organizationId: 'org-1',
      name: 'Field Lead',
      description: 'Updated role',
      userCount: 0,
      isSystem: false,
      permissions: emptyPermissions(),
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    deleteRole.mockResolvedValue(undefined);
  });

  it('loads and displays roles table data', async () => {
    render(<RolesPage />);

    expect((await screen.findAllByText('Administrator')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Field Coordinator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No').length).toBeGreaterThan(0);
  });

  it('creates a role from create dialog', async () => {
    render(<RolesPage />);

    await screen.findAllByText('Administrator');

    fireEvent.click(screen.getByRole('button', { name: 'Create Role' }));

    const dialog = screen.getByRole('dialog', { name: 'Create Role' });

    fireEvent.change(within(dialog).getByLabelText('Role Name'), {
      target: { value: 'Support Lead' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Role' }));

    await waitFor(() => {
      expect(createRole).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Role created successfully.')).toBeInTheDocument();
  });

  it('edits and deletes a custom role while protecting system role deletion', async () => {
    render(<RolesPage />);

    await screen.findAllByText('Administrator');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Custom Role' });
    expect(deleteButtons[0]).toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Role' })[0]);

    const editDialog = screen.getByRole('dialog', { name: 'Edit Role' });

    fireEvent.change(within(editDialog).getByLabelText('Role Name'), {
      target: { value: 'Field Lead' },
    });

    fireEvent.click(within(editDialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateRole).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete Custom Role' })[1]);

    const deleteDialog = screen.getByRole('dialog', { name: 'Confirm Delete' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete Role' }));

    await waitFor(() => {
      expect(deleteRole).toHaveBeenCalledTimes(1);
    });
  });
});

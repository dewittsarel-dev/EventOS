import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TasksPage from './page';

const listTasks = vi.fn();
const createTask = vi.fn();
const updateTask = vi.fn();
const deleteTask = vi.fn();
const updateTaskStatus = vi.fn();
const listOrganizationUsers = vi.fn();
const sessionState = {
  token: 'token-1',
  baseUrl: 'http://localhost:3001',
  organizationId: '11111111-1111-4111-8111-111111111111',
};

vi.mock('../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: sessionState,
    activeOrganization: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS',
      slug: 'eventos',
    },
  }),
}));

vi.mock('../../lib/tasks-api', () => ({
  listTasks: (...args: unknown[]) => listTasks(...args),
  createTask: (...args: unknown[]) => createTask(...args),
  updateTask: (...args: unknown[]) => updateTask(...args),
  deleteTask: (...args: unknown[]) => deleteTask(...args),
  updateTaskStatus: (...args: unknown[]) => updateTaskStatus(...args),
}));

vi.mock('../../lib/organization-users-api', () => ({
  listOrganizationUsers: (...args: unknown[]) => listOrganizationUsers(...args),
}));

const defaultTasks = [
  {
    id: 'task-1',
    organizationId: 'org-1',
    eventId: null,
    assignedUserId: 'user-1',
    assignedUserName: 'Alice Admin',
    quotationId: null,
    title: 'Confirm menu',
    description: 'Finalize with supplier',
    dueDate: '2026-08-02T12:00:00.000Z',
    priority: 'High',
    status: 'Todo',
    completedAt: null,
    archivedAt: null,
    createdAt: '2026-07-30T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    organizationName: 'EventOS',
    createdByUserId: 'creator-1',
    createdByName: 'Owner User',
  },
  {
    id: 'task-2',
    organizationId: 'org-1',
    eventId: null,
    assignedUserId: null,
    assignedUserName: null,
    quotationId: null,
    title: 'Send invoices',
    description: null,
    dueDate: null,
    priority: 'Medium',
    status: 'Completed',
    completedAt: '2026-07-29T10:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-07-30T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    organizationName: 'EventOS',
    createdByUserId: 'creator-1',
    createdByName: 'Owner User',
  },
] as const;

describe('TasksPage', () => {
  beforeEach(() => {
    listOrganizationUsers.mockReset();
    listTasks.mockReset();
    createTask.mockReset();
    updateTask.mockReset();
    deleteTask.mockReset();
    updateTaskStatus.mockReset();
    sessionState.token = 'token-1';
    sessionState.organizationId = '11111111-1111-4111-8111-111111111111';

    listOrganizationUsers.mockResolvedValue({
      data: [
        {
          membershipId: 'm-1',
          userId: 'user-1',
          name: 'Alice Admin',
          email: 'alice@example.com',
          role: 'Administrator',
          status: 'Active',
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });

    listTasks.mockResolvedValue({
      data: defaultTasks,
      meta: { page: 1, limit: 200, total: 2 },
    });

    createTask.mockResolvedValue(defaultTasks[0]);
    updateTask.mockResolvedValue(defaultTasks[0]);
    deleteTask.mockResolvedValue(undefined);
    updateTaskStatus.mockResolvedValue(defaultTasks[0]);
  });

  it('renders required task columns and rows', async () => {
    render(<TasksPage />);

    expect(await screen.findByText('Task Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Assigned User')).toBeInTheDocument();
    expect(screen.getByText('Created By')).toBeInTheDocument();

    expect((await screen.findAllByText('Confirm menu')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Owner User').length).toBeGreaterThan(0);
  });

  it('creates a task from the dialog', async () => {
    render(<TasksPage />);
    await screen.findAllByText('Confirm menu');

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    const dialog = screen.getByRole('dialog', { name: 'Create Task' });
    fireEvent.change(within(dialog).getByLabelText('Task Title'), {
      target: { value: 'Book transport' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Task' }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledTimes(1);
    });
  });

  it('edits, completes, reopens and deletes tasks', async () => {
    render(<TasksPage />);
    await screen.findAllByText('Confirm menu');

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Task' })[0]);

    const editDialog = screen.getByRole('dialog', { name: 'Edit Task' });
    fireEvent.change(within(editDialog).getByLabelText('Task Title'), {
      target: { value: 'Confirm menu updated' },
    });
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark Complete' })[0]);
    await waitFor(() => {
      expect(updateTaskStatus).toHaveBeenCalledWith(
        expect.anything(),
        'task-1',
        { status: 'Completed' },
      );
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Reopen Task' })[0]);
    await waitFor(() => {
      expect(updateTaskStatus).toHaveBeenCalledWith(
        expect.anything(),
        'task-2',
        { status: 'Todo' },
      );
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete Task' })[0]);
    const deleteDialog = screen.getByRole('dialog', { name: 'Confirm Delete' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete Task' }));

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledTimes(1);
    });
  });

  it('shows organization guidance and does not load tasks when organization is missing', async () => {
    sessionState.organizationId = '';

    render(<TasksPage />);

    expect(
      await screen.findByText(
        'Sign in and select an organization to manage tasks.',
      ),
    ).toBeInTheDocument();
    expect(listTasks).not.toHaveBeenCalled();
    expect(listOrganizationUsers).not.toHaveBeenCalled();
  });
});

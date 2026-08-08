import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';
import * as dashboardApi from '../lib/dashboard-api';

vi.mock('../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
    user: { id: 'user-1', email: 'user@example.com', name: 'Alicia' },
    activeOrganization: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS',
      slug: 'eventos',
    },
  }),
}));

vi.mock('../lib/dashboard-api', () => ({
  getDashboardOverview: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(dashboardApi.getDashboardOverview).mockReset();
    vi.mocked(dashboardApi.getDashboardOverview).mockResolvedValue({
      attention: {
        status: 'NeedsAttention',
        summary: '1 item needs your attention.',
        items: [
          {
            id: 'task-overdue-task-1',
            severity: 'Attention',
            title: 'Confirm venue access',
            explanation: 'This assigned task is overdue since 2026-08-01.',
            actionLabel: 'Open task',
            actionHref: '/tasks/task-1',
            source: 'Work',
          },
        ],
        generatedAt: '2026-08-08T08:00:00.000Z',
        automatedActionsPerformed: false,
      },
      stats: {
        eventsThisMonth: 4,
        upcomingEvents: 9,
        openQuotations: 3,
        tasksDueToday: 2,
        overdueTasks: 1,
        activeSuppliers: 7,
        totalContacts: 24,
      },
      upcomingEvents: [
        {
          id: 'event-1',
          event: 'Launch Gala',
          client: 'Alicia Keys',
          date: '2026-08-10T10:00:00.000Z',
          status: 'Planned',
        },
      ],
      myTasks: {
        dueToday: [
          {
            id: 'task-1',
            title: 'Confirm venue access',
            dueDate: '2026-08-01T08:00:00.000Z',
            status: 'Todo',
            priority: 'High',
          },
        ],
        overdue: [],
        dueThisWeek: [
          {
            id: 'task-1',
            title: 'Confirm venue access',
            dueDate: '2026-08-01T08:00:00.000Z',
            status: 'Todo',
            priority: 'High',
          },
        ],
      },
      recentActivity: [
        {
          type: 'event-created',
          action: 'Event created',
          subject: 'Launch Gala',
          occurredAt: '2026-08-01T09:00:00.000Z',
        },
      ],
      calendarPreview: [
        {
          date: '2026-08-10',
          events: [
            {
              id: 'event-1',
              title: 'Launch Gala',
              client: 'Alicia Keys',
              date: '2026-08-10T10:00:00.000Z',
              status: 'Planned',
            },
          ],
        },
      ],
    });
  });

  it('renders KPI cards and dashboard widgets from API overview', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText('Events This Month')).toBeInTheDocument();
    expect(screen.getByText('Active Suppliers')).toBeInTheDocument();
    expect(screen.getAllByText('Launch Gala').length).toBeGreaterThan(0);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Calendar Preview')).toBeInTheDocument();
    expect(screen.getByText('1 item needs your attention.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open task' })).toHaveAttribute(
      'href',
      '/tasks/task-1',
    );
  });

  it('shows error state when overview request fails', async () => {
    vi.mocked(dashboardApi.getDashboardOverview).mockRejectedValue(
      new Error('Dashboard request failed'),
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard request failed')).toBeInTheDocument();
    });
  });
});

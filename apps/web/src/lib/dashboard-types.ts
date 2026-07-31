export type DashboardStatBlock = {
  eventsThisMonth: number;
  upcomingEvents: number;
  openQuotations: number;
  tasksDueToday: number;
  overdueTasks: number;
  activeSuppliers: number;
  totalContacts: number;
};

export type DashboardUpcomingEvent = {
  id: string;
  event: string;
  client: string;
  date: string;
  status: 'Draft' | 'Planned' | 'Confirmed' | 'Completed' | 'Cancelled';
};

export type DashboardTaskItem = {
  id: string;
  title: string;
  dueDate: string | null;
  status: 'Todo' | 'InProgress' | 'Waiting' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
};

export type DashboardRecentActivity = {
  type: string;
  action: string;
  subject: string;
  occurredAt: string;
};

export type DashboardCalendarEvent = {
  id: string;
  title: string;
  client: string;
  date: string;
  status: 'Draft' | 'Planned' | 'Confirmed' | 'Completed' | 'Cancelled';
};

export type DashboardCalendarDay = {
  date: string;
  events: DashboardCalendarEvent[];
};

export type DashboardOverviewResponse = {
  stats: DashboardStatBlock;
  upcomingEvents: DashboardUpcomingEvent[];
  myTasks: {
    dueToday: DashboardTaskItem[];
    overdue: DashboardTaskItem[];
    dueThisWeek: DashboardTaskItem[];
  };
  recentActivity: DashboardRecentActivity[];
  calendarPreview: DashboardCalendarDay[];
};

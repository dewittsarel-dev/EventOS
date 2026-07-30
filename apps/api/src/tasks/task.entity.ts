import { TaskPriority } from './dto/task-priority.enum';
import { TaskStatus } from './dto/task-status.enum';

export interface Task {
  id: string;
  organizationId: string;
  eventId: string;
  assignedContactId: string | null;
  quotationId: string | null;
  title: string;
  description: string | null;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

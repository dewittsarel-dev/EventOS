import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EventStatus } from './../src/events/dto/event-status.enum';
import { PrismaService } from './../src/prisma/prisma.service';
import { QuotationStatus } from './../src/quotations/dto/quotation-status.enum';
import { TaskPriority } from './../src/tasks/dto/task-priority.enum';
import { TaskStatus } from './../src/tasks/dto/task-status.enum';

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type MembershipRecord = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type ContactRecord = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventRecord = {
  id: string;
  organizationId: string;
  contactId: string;
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};

type QuotationRecord = {
  id: string;
  organizationId: string;
  contactId: string;
  eventId: string;
  quoteNumber: string;
  title: string;
  notes: string | null;
  status: QuotationStatus;
  issueDate: Date;
  expiryDate: Date | null;
  subtotalCents: number;
  discountCents: number;
  taxRatePercent: number;
  taxCents: number;
  totalCents: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  organizationId: string;
  eventId: string | null;
  assignedUserId: string | null;
  quotationId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
};

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';
const CONTACT_1 = '33333333-3333-4333-8333-333333333333';
const EVENT_1 = '55555555-5555-4555-8555-555555555555';
const QUOTATION_1 = '77777777-7777-4777-8777-777777777777';

describe('TasksController (e2e)', () => {
  let app: INestApplication<App>;

  let users: UserRecord[];
  let memberships: MembershipRecord[];
  let contacts: ContactRecord[];
  let events: EventRecord[];
  let quotations: QuotationRecord[];
  let tasks: TaskRecord[];

  let taskSequence = 0;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    users = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'user1@example.com',
        name: null,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        email: 'user2@example.com',
        name: null,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    memberships = [
      {
        id: 'membership-1',
        userId: users[0].id,
        organizationId: ORG_1,
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'membership-2',
        userId: users[1].id,
        organizationId: ORG_2,
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    contacts = [
      {
        id: CONTACT_1,
        organizationId: ORG_1,
        firstName: 'Alicia',
        lastName: 'Keys',
        email: 'alicia@example.com',
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    events = [
      {
        id: EVENT_1,
        organizationId: ORG_1,
        contactId: CONTACT_1,
        title: 'Launch Gala',
        description: null,
        startDateTime: new Date('2026-11-10T10:00:00.000Z'),
        endDateTime: new Date('2026-11-10T18:00:00.000Z'),
        location: 'Main Hall',
        status: EventStatus.Planned,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    quotations = [
      {
        id: QUOTATION_1,
        organizationId: ORG_1,
        contactId: CONTACT_1,
        eventId: EVENT_1,
        quoteNumber: 'QUO-1',
        title: 'Main quote',
        notes: null,
        status: QuotationStatus.Draft,
        issueDate: new Date('2026-11-01T00:00:00.000Z'),
        expiryDate: null,
        subtotalCents: 100000,
        discountCents: 0,
        taxRatePercent: 0,
        taxCents: 0,
        totalCents: 100000,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    tasks = [];

    const prismaMock = {
      user: {
        findUnique: jest.fn(
          ({ where }: { where: { id?: string; email?: string } }) => {
            if (where.id) {
              return Promise.resolve(
                users.find((user) => user.id === where.id) ?? null,
              );
            }

            if (where.email) {
              return Promise.resolve(
                users.find((user) => user.email === where.email) ?? null,
              );
            }

            return Promise.resolve(null);
          },
        ),
        create: jest.fn(),
      },
      membership: {
        findUnique: jest.fn(
          ({
            where,
          }: {
            where: {
              userId_organizationId: { userId: string; organizationId: string };
            };
          }) =>
            Promise.resolve(
              memberships.find(
                (membership) =>
                  membership.userId === where.userId_organizationId.userId &&
                  membership.organizationId ===
                    where.userId_organizationId.organizationId,
              ) ?? null,
            ),
        ),
      },
      contact: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            contacts.find((contact) => contact.id === where.id) ?? null,
          ),
        ),
      },
      event: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            events.find((event) => event.id === where.id) ?? null,
          ),
        ),
      },
      quotation: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            quotations.find((quotation) => quotation.id === where.id) ?? null,
          ),
        ),
      },
      task: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<
              TaskRecord,
              'id' | 'createdAt' | 'updatedAt' | 'archivedAt'
            >;
          }) => {
            taskSequence += 1;
            const task: TaskRecord = {
              id: `task-${taskSequence}`,
              ...data,
              archivedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            tasks.unshift(task);
            return Promise.resolve(task);
          },
        ),
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(tasks.find((task) => task.id === where.id) ?? null),
        ),
        findMany: jest.fn(
          ({
            where,
            orderBy,
            skip,
            take,
          }: {
            where: {
              organizationId: string;
              eventId?: string;
              assignedUserId?: string;
              status?: TaskStatus;
              priority?: TaskPriority;
              archivedAt?: null;
              dueDate?: { gte?: Date; lte?: Date };
              OR?: Array<{
                title?: { contains: string; mode: 'insensitive' };
                description?: { contains: string; mode: 'insensitive' };
              }>;
            };
            orderBy: Record<string, 'asc' | 'desc'>;
            skip: number;
            take: number;
          }) => {
            let result = tasks.filter(
              (task) => task.organizationId === where.organizationId,
            );

            if (where.eventId) {
              result = result.filter((task) => task.eventId === where.eventId);
            }

            if (where.assignedUserId) {
              result = result.filter(
                (task) => task.assignedUserId === where.assignedUserId,
              );
            }

            if (where.status) {
              result = result.filter((task) => task.status === where.status);
            }

            if (where.priority) {
              result = result.filter(
                (task) => task.priority === where.priority,
              );
            }

            if (where.archivedAt === null) {
              result = result.filter((task) => task.archivedAt === null);
            }

            if (where.dueDate?.gte) {
              result = result.filter(
                (task) =>
                  task.dueDate &&
                  task.dueDate.getTime() >= where.dueDate!.gte!.getTime(),
              );
            }

            if (where.dueDate?.lte) {
              result = result.filter(
                (task) =>
                  task.dueDate &&
                  task.dueDate.getTime() <= where.dueDate!.lte!.getTime(),
              );
            }

            if (where.OR?.length) {
              const term =
                where.OR[0]?.title?.contains ??
                where.OR[1]?.description?.contains ??
                '';
              const lowered = term.toLowerCase();
              result = result.filter((task) =>
                [task.title, task.description ?? '']
                  .join(' ')
                  .toLowerCase()
                  .includes(lowered),
              );
            }

            const [sortField, direction] = Object.entries(orderBy)[0] as [
              keyof TaskRecord,
              'asc' | 'desc',
            ];

            result = result.sort((a, b) => {
              const left = a[sortField] as string | number | Date | null;
              const right = b[sortField] as string | number | Date | null;
              const leftValue =
                left instanceof Date
                  ? left.getTime()
                  : left === null
                    ? 0
                    : left;
              const rightValue =
                right instanceof Date
                  ? right.getTime()
                  : right === null
                    ? 0
                    : right;

              if (leftValue < rightValue) {
                return direction === 'asc' ? -1 : 1;
              }

              if (leftValue > rightValue) {
                return direction === 'asc' ? 1 : -1;
              }

              return 0;
            });

            return Promise.resolve(result.slice(skip, skip + take));
          },
        ),
        count: jest.fn(
          ({
            where,
          }: {
            where: { organizationId: string; archivedAt?: null };
          }) => {
            const result = tasks.filter(
              (task) =>
                task.organizationId === where.organizationId &&
                (where.archivedAt === null ? task.archivedAt === null : true),
            );
            return Promise.resolve(result.length);
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<TaskRecord>;
          }) => {
            const index = tasks.findIndex((task) => task.id === where.id);
            if (index === -1) {
              return Promise.resolve(null);
            }

            const updated: TaskRecord = {
              ...tasks[index],
              ...data,
              dueDate: data.dueDate
                ? new Date(data.dueDate)
                : tasks[index].dueDate,
              completedAt:
                data.completedAt !== undefined
                  ? data.completedAt
                    ? new Date(data.completedAt)
                    : null
                  : tasks[index].completedAt,
              updatedAt: new Date(),
            };
            tasks[index] = updated;
            return Promise.resolve(updated);
          },
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          tasks = tasks.filter((task) => task.id !== where.id);
          return Promise.resolve({ id: where.id });
        }),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      quotationItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_TOKEN_TTL;
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'secure1234' })
      .expect(200);

    const body = response.body as { accessToken: string };

    return body.accessToken;
  }

  it('supports create/list/get/update/complete/archive/delete for tasks', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        eventId: EVENT_1,
        assignedUserId: users[0].id,
        quotationId: QUOTATION_1,
        title: 'Finalize seating chart',
        description: 'Confirm with venue manager',
        dueDate: '2026-11-09T12:00:00.000Z',
        priority: TaskPriority.High,
        status: TaskStatus.Todo,
      })
      .expect(201);

    const created = createdResponse.body as TaskRecord;

    expect(created).toEqual(
      expect.objectContaining({
        title: 'Finalize seating chart',
        priority: TaskPriority.High,
        status: TaskStatus.Todo,
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .query({
        organizationId: ORG_1,
        page: 1,
        limit: 10,
        search: 'seating',
        eventId: EVENT_1,
        status: TaskStatus.Todo,
        priority: TaskPriority.High,
        sortBy: 'dueDate',
        sort: 'asc',
      })
      .expect(200);

    const listBody = listResponse.body as {
      data: TaskRecord[];
      meta: { page: number; limit: number; total: number };
    };

    expect(listBody.meta).toEqual({ page: 1, limit: 10, total: 1 });
    expect(listBody.data[0]?.title).toBe('Finalize seating chart');

    await request(app.getHttpServer())
      .get(`/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updatedResponse = await request(app.getHttpServer())
      .put(`/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Finalize seating chart v2',
        status: TaskStatus.InProgress,
        priority: TaskPriority.Critical,
      })
      .expect(200);

    expect(updatedResponse.body).toEqual(
      expect.objectContaining({
        title: 'Finalize seating chart v2',
        status: TaskStatus.InProgress,
        priority: TaskPriority.Critical,
      }),
    );

    const completedResponse = await request(app.getHttpServer())
      .patch(`/tasks/${created.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: TaskStatus.Completed })
      .expect(200);

    expect(completedResponse.body).toEqual(
      expect.objectContaining({
        status: TaskStatus.Completed,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/tasks/${created.id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const activeList = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1 })
      .expect(200);

    const activeBody = activeList.body as {
      meta: { total: number };
    };
    expect(activeBody.meta.total).toBe(0);

    const withArchived = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1, includeArchived: true })
      .expect(200);

    const withArchivedBody = withArchived.body as {
      meta: { total: number };
    };
    expect(withArchivedBody.meta.total).toBe(1);

    await request(app.getHttpServer())
      .delete(`/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('enforces authentication and organization isolation', async () => {
    const tokenUser2 = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/tasks')
      .query({ organizationId: ORG_1 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/tasks')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(403);
  });

  it('validates payload constraints', async () => {
    const token = await login('user1@example.com');

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        eventId: EVENT_1,
        title: 'Bad task',
        dueDate: 'invalid-date',
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1, page: 0 })
      .expect(400);
  });
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';

describe('DashboardController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    const users = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'user1@example.com',
        name: 'User One',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'user2@example.com',
        name: 'User Two',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const memberships = [
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
      event: {
        count: jest.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(4),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'event-1',
              title: 'Launch Gala',
              startDateTime: new Date('2026-08-10T10:00:00.000Z'),
              status: 'Planned',
              contact: { firstName: 'Alicia', lastName: 'Keys' },
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'event-3',
              title: 'Ops sync',
              createdAt: new Date('2026-08-01T11:00:00.000Z'),
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'event-1',
              title: 'Launch Gala',
              startDateTime: new Date('2026-08-10T10:00:00.000Z'),
              status: 'Planned',
              contact: { firstName: 'Alicia', lastName: 'Keys' },
            },
          ]),
      },
      quotation: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'quotation-1',
            quoteNumber: 'Q-100',
            title: 'Expo',
            createdAt: new Date('2026-08-01T10:00:00.000Z'),
          },
        ]),
      },
      task: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'task-1',
              title: 'Venue confirmation',
              dueDate: new Date('2026-08-01T08:00:00.000Z'),
              status: 'Todo',
              priority: 'High',
            },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              id: 'task-2',
              title: 'AV follow-up',
              dueDate: new Date('2026-08-03T08:00:00.000Z'),
              status: 'InProgress',
              priority: 'Medium',
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'task-9',
              title: 'Checklist complete',
              completedAt: new Date('2026-08-01T09:00:00.000Z'),
            },
          ]),
      },
      supplier: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'supplier-1',
            companyName: 'Nova Security',
            createdAt: new Date('2026-08-01T12:00:00.000Z'),
          },
        ]),
      },
      contact: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'contact-1',
            firstName: 'Alex',
            lastName: 'Meyer',
            createdAt: new Date('2026-08-01T07:00:00.000Z'),
          },
        ]),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

    const responseBody = response.body as Record<string, unknown>;
    const accessToken = responseBody.accessToken;

    if (typeof accessToken !== 'string') {
      throw new Error('Expected accessToken in login response');
    }

    return accessToken;
  }

  it('returns dashboard overview for organization members', async () => {
    const token = await login('user1@example.com');

    const rawResponse: unknown = await request(app.getHttpServer())
      .get('/dashboard/overview')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    if (
      !rawResponse ||
      typeof rawResponse !== 'object' ||
      !('body' in rawResponse)
    ) {
      throw new Error('Expected response body');
    }

    const responseBody: unknown = (rawResponse as { body?: unknown }).body;

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Expected response body object');
    }

    const dashboardBody = responseBody as {
      stats?: unknown;
      upcomingEvents?: unknown;
    };

    if (!dashboardBody.stats || typeof dashboardBody.stats !== 'object') {
      throw new Error('Expected stats in response body');
    }

    const stats = dashboardBody.stats as Record<string, unknown>;

    expect(stats.eventsThisMonth).toBe(2);
    expect(stats.upcomingEvents).toBe(4);
    expect(stats.openQuotations).toBe(3);
    expect(stats.tasksDueToday).toBe(1);
    expect(stats.overdueTasks).toBe(2);
    expect(stats.activeSuppliers).toBe(5);
    expect(stats.totalContacts).toBe(12);

    if (!Array.isArray(dashboardBody.upcomingEvents)) {
      throw new Error('Expected upcomingEvents to be an array');
    }

    const upcomingEvents = dashboardBody.upcomingEvents;

    expect(Array.isArray(upcomingEvents)).toBe(true);
    expect(upcomingEvents).toHaveLength(1);
  });

  it('enforces organization isolation', async () => {
    const token = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/dashboard/overview')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

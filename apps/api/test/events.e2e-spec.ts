import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EventStatus } from './../src/events/dto/event-status.enum';
import { PrismaService } from './../src/prisma/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
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
  assignedUserId: string | null;
  title: string;
  eventType: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  venue: string | null;
  budgetCents: number | null;
  notes: string | null;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  contact: {
    firstName: string;
    lastName: string | null;
  };
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type MembershipRecord = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';
const CONTACT_1 = '33333333-3333-4333-8333-333333333333';

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    organizationId: ORG_1,
    contactId: CONTACT_1,
    assignedUserId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Wedding Reception',
    eventType: 'Wedding',
    eventDate: new Date('2026-12-01T00:00:00.000Z'),
    startTime: '12:00',
    endTime: '14:00',
    venue: 'Cape Town',
    budgetCents: 250000,
    notes: 'Main hall ceremony',
    description: 'Main hall ceremony',
    startDateTime: new Date('2026-12-01T12:00:00.000Z'),
    endDateTime: new Date('2026-12-01T14:00:00.000Z'),
    location: 'Cape Town',
    status: EventStatus.Planned,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: {
      firstName: 'Lara',
      lastName: 'Croft',
    },
    assignedUser: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: null,
      email: 'user1@example.com',
    },
    ...overrides,
  };
}

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;

  let users: UserRecord[];
  let contacts: ContactRecord[];
  let memberships: MembershipRecord[];
  let events: EventRecord[];

  let eventSequence = 0;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    users = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'user1@example.com',
        name: null,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'user2@example.com',
        name: null,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    contacts = [
      {
        id: CONTACT_1,
        organizationId: ORG_1,
        firstName: 'Lara',
        lastName: 'Croft',
        email: 'lara@example.com',
        phone: null,
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

    events = [
      makeEvent({
        id: '55555555-5555-5555-5555-555555555555',
        title: 'Alpha Conference',
        startDateTime: new Date('2026-11-01T10:00:00.000Z'),
      }),
      makeEvent({
        id: '66666666-6666-6666-6666-666666666666',
        title: 'Beta Wedding',
        status: EventStatus.Confirmed,
        startDateTime: new Date('2026-12-10T10:00:00.000Z'),
      }),
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
      contact: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            contacts.find((contact) => contact.id === where.id) ?? null,
          ),
        ),
      },
      event: {
        create: jest.fn(
          ({
            data,
          }: {
            data: {
              organizationId: string;
              contactId: string;
              assignedUserId?: string | null;
              title: string;
              eventType: string;
              eventDate: Date;
              startTime: string;
              endTime: string;
              venue?: string | null;
              budgetCents?: number | null;
              notes?: string | null;
              description?: string | null;
              startDateTime: Date;
              endDateTime: Date;
              location?: string | null;
              status: EventStatus;
            };
          }) => {
            eventSequence += 1;
            const event = makeEvent({
              id: `event-${eventSequence}`,
              ...data,
              assignedUserId: data.assignedUserId ?? null,
              eventDate: new Date(data.eventDate),
              startDateTime: new Date(data.startDateTime),
              endDateTime: new Date(data.endDateTime),
              venue: data.venue ?? null,
              location: data.location ?? data.venue ?? null,
              notes: data.notes ?? null,
              description: data.description ?? data.notes ?? null,
              assignedUser:
                data.assignedUserId === users[0]?.id
                  ? {
                      id: users[0].id,
                      name: users[0].name,
                      email: users[0].email,
                    }
                  : null,
            });
            events.unshift(event);
            return Promise.resolve(event);
          },
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
              OR?: Array<{
                title?: { contains: string; mode: 'insensitive' };
                eventType?: { contains: string; mode: 'insensitive' };
                venue?: { contains: string; mode: 'insensitive' };
              }>;
              eventType?: { contains: string; mode: 'insensitive' };
              assignedUserId?: string;
              status?: EventStatus;
            };
            orderBy: { startDateTime: 'asc' | 'desc' };
            skip: number;
            take: number;
          }) => {
            let result = events.filter(
              (event) => event.organizationId === where.organizationId,
            );

            const search = where.OR?.[0]?.title?.contains;
            if (search) {
              const searchTerm = search.toLowerCase();
              result = result.filter((event) =>
                [event.title, event.eventType, event.venue ?? '']
                  .join(' ')
                  .toLowerCase()
                  .includes(searchTerm),
              );
            }

            if (where.eventType?.contains) {
              const eventTypeSearch = where.eventType.contains.toLowerCase();
              result = result.filter((event) =>
                event.eventType.toLowerCase().includes(eventTypeSearch),
              );
            }

            if (where.assignedUserId) {
              result = result.filter(
                (event) => event.assignedUserId === where.assignedUserId,
              );
            }

            if (where.status) {
              result = result.filter((event) => event.status === where.status);
            }

            result = result.sort((left, right) =>
              orderBy.startDateTime === 'asc'
                ? left.startDateTime.getTime() - right.startDateTime.getTime()
                : right.startDateTime.getTime() - left.startDateTime.getTime(),
            );

            return Promise.resolve(result.slice(skip, skip + take));
          },
        ),
        count: jest.fn(
          ({
            where,
          }: {
            where: {
              organizationId: string;
              OR?: Array<{
                title?: { contains: string; mode: 'insensitive' };
                eventType?: { contains: string; mode: 'insensitive' };
                venue?: { contains: string; mode: 'insensitive' };
              }>;
              eventType?: { contains: string; mode: 'insensitive' };
              assignedUserId?: string;
              status?: EventStatus;
            };
          }) => {
            let result = events.filter(
              (event) => event.organizationId === where.organizationId,
            );

            const search = where.OR?.[0]?.title?.contains;
            if (search) {
              const searchTerm = search.toLowerCase();
              result = result.filter((event) =>
                [event.title, event.eventType, event.venue ?? '']
                  .join(' ')
                  .toLowerCase()
                  .includes(searchTerm),
              );
            }

            if (where.eventType?.contains) {
              const eventTypeSearch = where.eventType.contains.toLowerCase();
              result = result.filter((event) =>
                event.eventType.toLowerCase().includes(eventTypeSearch),
              );
            }

            if (where.assignedUserId) {
              result = result.filter(
                (event) => event.assignedUserId === where.assignedUserId,
              );
            }

            if (where.status) {
              result = result.filter((event) => event.status === where.status);
            }

            return Promise.resolve(result.length);
          },
        ),
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            events.find((event) => event.id === where.id) ?? null,
          ),
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<EventRecord>;
          }) => {
            const index = events.findIndex((event) => event.id === where.id);

            if (index === -1) {
              return Promise.resolve(null);
            }

            const updated: EventRecord = {
              ...events[index],
              ...data,
              assignedUser:
                data.assignedUserId === undefined
                  ? events[index].assignedUser
                  : data.assignedUserId === users[0]?.id
                    ? {
                        id: users[0].id,
                        name: users[0].name,
                        email: users[0].email,
                      }
                    : null,
              eventDate: data.eventDate
                ? new Date(data.eventDate)
                : events[index].eventDate,
              startDateTime: data.startDateTime
                ? new Date(data.startDateTime)
                : events[index].startDateTime,
              endDateTime: data.endDateTime
                ? new Date(data.endDateTime)
                : events[index].endDateTime,
              updatedAt: new Date(),
            };

            events[index] = updated;

            return Promise.resolve(updated);
          },
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          const event = events.find((entry) => entry.id === where.id);
          events = events.filter((entry) => entry.id !== where.id);
          return Promise.resolve(event);
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

  it('supports create, list with filter/search/sort/pagination, get, update and delete', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        contactId: CONTACT_1,
        assignedUserId: users[0].id,
        title: 'Gamma Expo',
        eventType: 'Expo',
        eventDate: '2026-12-20T00:00:00.000Z',
        startTime: '08:00',
        endTime: '18:00',
        venue: 'Durban ICC',
        budgetCents: 450000,
        notes: 'Expo details',
        status: EventStatus.Planned,
      })
      .expect(201);

    const created = createdResponse.body as EventRecord;
    expect(created).toEqual(
      expect.objectContaining({
        title: 'Gamma Expo',
        eventType: 'Expo',
        status: EventStatus.Planned,
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/events')
      .query({
        organizationId: ORG_1,
        page: 1,
        limit: 1,
        search: 'gamma',
        status: EventStatus.Planned,
        sort: 'asc',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = listResponse.body as {
      data: EventRecord[];
      meta: { page: number; limit: number; total: number };
    };

    expect(listBody.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 1,
      }),
    );
    expect(listBody.data[0]?.title).toContain('Gamma');

    await request(app.getHttpServer())
      .get(`/events/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/events/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: EventStatus.Confirmed,
        title: 'Gamma Expo Confirmed',
        notes: 'Confirmed with venue',
      })
      .expect(200);

    expect(updatedResponse.body).toEqual(
      expect.objectContaining({
        status: EventStatus.Confirmed,
        title: 'Gamma Expo Confirmed',
        notes: 'Confirmed with venue',
      }),
    );

    const replacedResponse = await request(app.getHttpServer())
      .put(`/events/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Gamma Expo Confirmed',
        eventType: 'Expo',
        eventDate: '2026-12-20T00:00:00.000Z',
        startTime: '08:00',
        endTime: '18:00',
        status: EventStatus.Confirmed,
        venue: 'Durban ICC Hall B',
      })
      .expect(200);

    expect(replacedResponse.body).toEqual(
      expect.objectContaining({
        venue: 'Durban ICC Hall B',
      }),
    );

    await request(app.getHttpServer())
      .delete(`/events/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/events/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('enforces authentication and organization isolation', async () => {
    const tokenUser1 = await login('user1@example.com');
    const tokenUser2 = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/events')
      .query({ organizationId: ORG_1 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/events')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch('/events/55555555-5555-5555-5555-555555555555')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({ title: 'Unauthorized' })
      .expect(403);

    await request(app.getHttpServer())
      .put('/events/55555555-5555-5555-5555-555555555555')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({ title: 'Unauthorized' })
      .expect(403);

    await request(app.getHttpServer())
      .delete('/events/55555555-5555-5555-5555-555555555555')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(403);

    // Ensure valid user can still read own event.
    await request(app.getHttpServer())
      .get('/events/55555555-5555-5555-5555-555555555555')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .expect(200);
  });

  it('validates payload and filtering inputs', async () => {
    const token = await login('user1@example.com');

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        contactId: CONTACT_1,
        eventType: 'Wedding',
        eventDate: '2026-12-21T00:00:00.000Z',
        startTime: '20:00',
        endTime: '10:00',
        venue: 'Venue 1',
        title: 'Invalid Event',
        status: EventStatus.Draft,
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1, page: 0 })
      .expect(400);
  });
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EventStatus } from './../src/events/dto/event-status.enum';
import { PrismaService } from './../src/prisma/prisma.service';
import { QuotationStatus } from './../src/quotations/dto/quotation-status.enum';

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

type QuotationItemRecord = {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  lineTotalCents: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type QuotationRecord = {
  id: string;
  quoteNumber: string;
  organizationId: string;
  contactId: string;
  eventId: string;
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

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';
const CONTACT_1 = '33333333-3333-4333-8333-333333333333';
const EVENT_1 = '55555555-5555-4555-8555-555555555555';

describe('QuotationsController (e2e)', () => {
  let app: INestApplication<App>;

  let users: UserRecord[];
  let memberships: MembershipRecord[];
  let contacts: ContactRecord[];
  let events: EventRecord[];
  let quotations: QuotationRecord[];
  let quotationItems: QuotationItemRecord[];

  let quoteSequence = 0;
  let itemSequence = 0;

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

    quotations = [];
    quotationItems = [];

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
      quotationItem: {
        deleteMany: jest.fn(({ where }: { where: { quotationId: string } }) => {
          quotationItems = quotationItems.filter(
            (item) => item.quotationId !== where.quotationId,
          );
          return Promise.resolve({ count: 1 });
        }),
        createMany: jest.fn(
          ({
            data,
          }: {
            data: Array<
              Omit<QuotationItemRecord, 'id' | 'createdAt' | 'updatedAt'>
            >;
          }) => {
            data.forEach((item) => {
              itemSequence += 1;
              quotationItems.push({
                id: `item-${itemSequence}`,
                ...item,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            });
            return Promise.resolve({ count: data.length });
          },
        ),
      },
      quotation: {
        create: jest.fn(
          ({
            data,
          }: {
            data: {
              quoteNumber: string;
              organizationId: string;
              contactId: string;
              eventId: string;
              title: string;
              notes?: string;
              status: QuotationStatus;
              issueDate: Date;
              expiryDate: Date | null;
              subtotalCents: number;
              discountCents: number;
              taxRatePercent: number;
              taxCents: number;
              totalCents: number;
              items: {
                create: Array<{
                  description: string;
                  quantity: number;
                  unitPriceCents: number;
                  discountCents: number;
                  lineTotalCents: number;
                  sortOrder: number;
                }>;
              };
            };
          }) => {
            quoteSequence += 1;
            const id = `quote-${quoteSequence}`;
            const quotation: QuotationRecord = {
              id,
              quoteNumber: data.quoteNumber,
              organizationId: data.organizationId,
              contactId: data.contactId,
              eventId: data.eventId,
              title: data.title,
              notes: data.notes ?? null,
              status: data.status,
              issueDate: data.issueDate,
              expiryDate: data.expiryDate,
              subtotalCents: data.subtotalCents,
              discountCents: data.discountCents,
              taxRatePercent: data.taxRatePercent,
              taxCents: data.taxCents,
              totalCents: data.totalCents,
              archivedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            quotations.unshift(quotation);

            data.items.create.forEach((item) => {
              itemSequence += 1;
              quotationItems.push({
                id: `item-${itemSequence}`,
                quotationId: id,
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                discountCents: item.discountCents,
                lineTotalCents: item.lineTotalCents,
                sortOrder: item.sortOrder,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            });

            return Promise.resolve({
              ...quotation,
              items: quotationItems
                .filter((item) => item.quotationId === id)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            });
          },
        ),
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          const quotation = quotations.find((entry) => entry.id === where.id);

          if (!quotation) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            ...quotation,
            items: quotationItems
              .filter((item) => item.quotationId === quotation.id)
              .sort((a, b) => a.sortOrder - b.sortOrder),
          });
        }),
        findMany: jest.fn(
          ({
            where,
            orderBy,
            skip,
            take,
          }: {
            where: {
              organizationId: string;
              contactId?: string;
              eventId?: string;
              status?: QuotationStatus;
              archivedAt?: null;
              OR?: Array<{
                quoteNumber?: { contains: string; mode: 'insensitive' };
                title?: { contains: string; mode: 'insensitive' };
                notes?: { contains: string; mode: 'insensitive' };
              }>;
            };
            orderBy: Record<string, 'asc' | 'desc'>;
            skip: number;
            take: number;
          }) => {
            let result = quotations.filter(
              (entry) => entry.organizationId === where.organizationId,
            );

            if (where.archivedAt === null) {
              result = result.filter((entry) => entry.archivedAt === null);
            }

            if (where.contactId) {
              result = result.filter(
                (entry) => entry.contactId === where.contactId,
              );
            }

            if (where.eventId) {
              result = result.filter(
                (entry) => entry.eventId === where.eventId,
              );
            }

            if (where.status) {
              result = result.filter((entry) => entry.status === where.status);
            }

            if (where.OR?.length) {
              const term =
                where.OR[0]?.quoteNumber?.contains ??
                where.OR[1]?.title?.contains ??
                where.OR[2]?.notes?.contains ??
                '';
              const lowered = term.toLowerCase();

              result = result.filter((entry) =>
                [entry.quoteNumber, entry.title, entry.notes ?? '']
                  .join(' ')
                  .toLowerCase()
                  .includes(lowered),
              );
            }

            const [sortField, direction] = Object.entries(orderBy)[0] as [
              keyof QuotationRecord,
              'asc' | 'desc',
            ];

            result = result.sort((a, b) => {
              const left = a[sortField];
              const right = b[sortField];

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

            return Promise.resolve(
              result.slice(skip, skip + take).map((entry) => ({
                ...entry,
                items: quotationItems
                  .filter((item) => item.quotationId === entry.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder),
              })),
            );
          },
        ),
        count: jest.fn(
          ({
            where,
          }: {
            where: { organizationId: string; archivedAt?: null };
          }) => {
            const result = quotations.filter(
              (entry) =>
                entry.organizationId === where.organizationId &&
                (where.archivedAt === null ? entry.archivedAt === null : true),
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
            data: Partial<QuotationRecord>;
          }) => {
            const index = quotations.findIndex(
              (entry) => entry.id === where.id,
            );

            if (index === -1) {
              return Promise.resolve(null);
            }

            const updated: QuotationRecord = {
              ...quotations[index],
              ...data,
              updatedAt: new Date(),
            };
            quotations[index] = updated;

            return Promise.resolve({
              ...updated,
              items: quotationItems
                .filter((item) => item.quotationId === updated.id)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            });
          },
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          quotations = quotations.filter((entry) => entry.id !== where.id);
          quotationItems = quotationItems.filter(
            (item) => item.quotationId !== where.id,
          );
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
      $transaction: jest.fn(async (arg: unknown) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg as Promise<unknown>[]);
        }

        if (typeof arg === 'function') {
          const callback = arg as (tx: typeof prismaMock) => Promise<unknown>;
          return callback(prismaMock);
        }

        return Promise.resolve([]);
      }),
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

  it('supports create/list/get/update/status/archive/delete for quotations', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        contactId: CONTACT_1,
        eventId: EVENT_1,
        title: 'Premium Package',
        notes: 'Net 14 days',
        discountCents: 5000,
        taxRatePercent: 15,
        status: QuotationStatus.Draft,
        items: [
          {
            description: 'Venue',
            quantity: 1,
            unitPriceCents: 100000,
          },
          {
            description: 'Catering',
            quantity: 2,
            unitPriceCents: 50000,
          },
        ],
      })
      .expect(201);

    const created = createdResponse.body as QuotationRecord & {
      items: QuotationItemRecord[];
    };

    expect(created).toEqual(
      expect.objectContaining({
        title: 'Premium Package',
        subtotalCents: 200000,
        discountCents: 5000,
        taxCents: 29250,
        totalCents: 224250,
      }),
    );
    expect(created.items).toHaveLength(2);

    const listResponse = await request(app.getHttpServer())
      .get('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .query({
        organizationId: ORG_1,
        page: 1,
        limit: 10,
        search: 'premium',
        sortBy: 'totalCents',
        sort: 'desc',
      })
      .expect(200);

    const listBody = listResponse.body as {
      data: Array<{ title: string }>;
      meta: { page: number; limit: number; total: number };
    };

    expect(listBody.meta).toEqual({ page: 1, limit: 10, total: 1 });
    expect(listBody.data[0]?.title).toBe('Premium Package');

    await request(app.getHttpServer())
      .get(`/quotations/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updatedResponse = await request(app.getHttpServer())
      .put(`/quotations/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Premium Package Updated',
        items: [
          {
            description: 'Venue',
            quantity: 1,
            unitPriceCents: 120000,
          },
        ],
        discountCents: 2000,
        taxRatePercent: 10,
      })
      .expect(200);

    expect(updatedResponse.body).toEqual(
      expect.objectContaining({
        title: 'Premium Package Updated',
        subtotalCents: 120000,
        discountCents: 2000,
        taxCents: 11800,
        totalCents: 129800,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/quotations/${created.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: QuotationStatus.Sent })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/quotations/${created.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: QuotationStatus.Accepted })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/quotations/${created.id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const archivedList = await request(app.getHttpServer())
      .get('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1 })
      .expect(200);

    const archivedBody = archivedList.body as {
      meta: { total: number };
    };

    expect(archivedBody.meta.total).toBe(0);

    const withArchived = await request(app.getHttpServer())
      .get('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1, includeArchived: true })
      .expect(200);

    const withArchivedBody = withArchived.body as {
      meta: { total: number };
    };

    expect(withArchivedBody.meta.total).toBe(1);

    await request(app.getHttpServer())
      .delete(`/quotations/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('enforces authentication and organization isolation', async () => {
    const tokenUser2 = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/quotations')
      .query({ organizationId: ORG_1 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/quotations')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(403);
  });

  it('validates payloads and status transitions', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        contactId: CONTACT_1,
        eventId: EVENT_1,
        title: 'Transition Test',
        discountCents: 0,
        taxRatePercent: 0,
        status: QuotationStatus.Draft,
        items: [
          {
            description: 'Line',
            quantity: 1,
            unitPriceCents: 1000,
          },
        ],
      })
      .expect(201);

    const created = createdResponse.body as QuotationRecord;

    await request(app.getHttpServer())
      .post('/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        contactId: CONTACT_1,
        eventId: EVENT_1,
        title: 'Invalid Quote',
        discountCents: 5000,
        items: [
          {
            description: 'Line',
            quantity: 1,
            unitPriceCents: 1000,
          },
        ],
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/quotations/${created.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: QuotationStatus.Accepted })
      .expect(400);
  });
});

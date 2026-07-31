import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

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
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InventoryItemRecord = {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
};

type LocationRecord = {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
};

type LoginResponse = {
  accessToken: string;
};

type CategoriesResponse = {
  data: CategoryRecord[];
  meta: {
    total: number;
  };
};

type TransferErrorResponse = {
  message: string | string[];
};

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';

describe('InventoryController (e2e)', () => {
  let app: INestApplication<App>;

  let users: UserRecord[];
  let memberships: MembershipRecord[];
  let categories: CategoryRecord[];

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

    memberships = [
      {
        id: 'membership-1',
        userId: users[0].id,
        organizationId: ORG_1,
        role: 'owner',
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'membership-2',
        userId: users[1].id,
        organizationId: ORG_2,
        role: 'owner',
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    categories = [];

    const itemRecord: InventoryItemRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      organizationId: ORG_1,
      name: 'Banquet Chair',
      active: true,
    };

    const locationRecord: LocationRecord = {
      id: '44444444-4444-4444-8444-444444444444',
      organizationId: ORG_1,
      name: 'Main Warehouse',
      active: true,
    };

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
        findMany: jest.fn(),
      },
      role: {
        findFirst: jest.fn(() => Promise.resolve(null)),
      },
      inventoryCategory: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<CategoryRecord, 'id' | 'createdAt' | 'updatedAt'>;
          }) => {
            const created: CategoryRecord = {
              id: `category-${categories.length + 1}`,
              organizationId: data.organizationId,
              name: data.name,
              description: data.description,
              active: data.active,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            categories.push(created);
            return Promise.resolve(created);
          },
        ),
        findMany: jest.fn(({ where }: { where: { organizationId: string } }) =>
          Promise.resolve(
            categories.filter(
              (category) => category.organizationId === where.organizationId,
            ),
          ),
        ),
        count: jest.fn(({ where }: { where: { organizationId: string } }) =>
          Promise.resolve(
            categories.filter(
              (category) => category.organizationId === where.organizationId,
            ).length,
          ),
        ),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      storageLocation: {
        findUnique: jest.fn(() => Promise.resolve(locationRecord)),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      inventoryItem: {
        findUnique: jest.fn(() => Promise.resolve(itemRecord)),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      supplier: {
        findUnique: jest.fn(),
      },
      stockLevel: {
        findUnique: jest.fn(() =>
          Promise.resolve({
            inventoryItemId: itemRecord.id,
            storageLocationId: locationRecord.id,
            quantityOnHand: 10,
            quantityReserved: 1,
          }),
        ),
        upsert: jest.fn(),
        groupBy: jest.fn(() => Promise.resolve([])),
        findMany: jest.fn(() => Promise.resolve([])),
        count: jest.fn(() => Promise.resolve(0)),
      },
      stockMovement: {
        create: jest.fn(),
        findMany: jest.fn(() => Promise.resolve([])),
        count: jest.fn(() => Promise.resolve(0)),
      },
      $transaction: jest.fn(async (handler: unknown) => {
        if (typeof handler === 'function') {
          const transactionHandler = handler as (
            client: typeof prismaMock,
          ) => Promise<unknown>;
          return transactionHandler(prismaMock);
        }

        return Promise.all(handler as Promise<unknown>[]);
      }),
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
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'secure1234',
      })
      .expect(200);

    return (response.body as LoginResponse).accessToken;
  }

  it('creates and lists inventory categories in organization scope', async () => {
    const token = await login('user1@example.com');

    await request(app.getHttpServer())
      .post('/inventory/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        name: 'Furniture',
        description: 'Tables and chairs',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as CategoryRecord;
        expect(body.organizationId).toBe(ORG_1);
        expect(body.name).toBe('Furniture');
      });

    await request(app.getHttpServer())
      .get('/inventory/categories')
      .set('Authorization', `Bearer ${token}`)
      .query({ organizationId: ORG_1 })
      .expect(200)
      .expect((response) => {
        const body = response.body as CategoriesResponse;
        expect(body.data).toHaveLength(1);
        expect(body.meta.total).toBe(1);
      });
  });

  it('rejects category creation in another organization', async () => {
    const token = await login('user2@example.com');

    await request(app.getHttpServer())
      .post('/inventory/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        name: 'Decor',
      })
      .expect(403);
  });

  it('rejects transfers to the same location', async () => {
    const token = await login('user1@example.com');

    await request(app.getHttpServer())
      .post('/inventory/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        inventoryItemId: '33333333-3333-4333-8333-333333333333',
        sourceLocationId: '44444444-4444-4444-8444-444444444444',
        destinationLocationId: '44444444-4444-4444-8444-444444444444',
        quantity: 1,
        reason: 'Move stock',
      })
      .expect(400)
      .expect((response) => {
        const body = response.body as TransferErrorResponse;
        const messages = Array.isArray(body.message)
          ? body.message
          : [body.message];
        expect(messages).toContain(
          'Source and destination locations cannot be the same',
        );
      });
  });
});

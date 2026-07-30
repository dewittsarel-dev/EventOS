import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

type RoleRow = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

describe('RolesController (e2e)', () => {
  let app: INestApplication<App>;
  let roles: RoleRow[];
  let memberships: Array<{
    role: string;
    organizationId: string;
    userId: string;
  }>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    roles = [
      {
        id: 'role-1',
        organizationId: ORG_ID,
        name: 'Administrator',
        description: 'System role',
        permissions: JSON.stringify({}),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-2',
        organizationId: ORG_ID,
        name: 'Manager',
        description: 'System role',
        permissions: JSON.stringify({}),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-3',
        organizationId: ORG_ID,
        name: 'Staff',
        description: 'System role',
        permissions: JSON.stringify({}),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    memberships = [
      { role: 'Administrator', organizationId: ORG_ID, userId: ACTOR_ID },
      {
        role: 'Manager',
        organizationId: ORG_ID,
        userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      },
    ];

    const users = [
      {
        id: ACTOR_ID,
        email: 'actor@example.com',
        name: 'Actor User',
        passwordHash,
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
                users.find((item) => item.id === where.id) ?? null,
              );
            }

            if (where.email) {
              return Promise.resolve(
                users.find((item) => item.email === where.email) ?? null,
              );
            }

            return Promise.resolve(null);
          },
        ),
        create: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: ORG_ID,
            name: 'EventOS',
            slug: 'eventos',
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            where.id === ORG_ID
              ? {
                  id: ORG_ID,
                  name: 'EventOS',
                  slug: 'eventos',
                }
              : null,
          ),
        ),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      membership: {
        findUnique: jest.fn(
          ({
            where,
          }: {
            where: {
              userId_organizationId: { userId: string; organizationId: string };
            };
          }) => {
            const key = where.userId_organizationId;
            const match = memberships.find(
              (item) =>
                item.userId === key.userId &&
                item.organizationId === key.organizationId,
            );

            if (!match) {
              return Promise.resolve(null);
            }

            return Promise.resolve({
              id: `membership-${match.userId}`,
              userId: match.userId,
              organizationId: match.organizationId,
              role: match.role,
              isDisabled: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
        ),
        findMany: jest.fn(({ where }: { where: { organizationId: string } }) =>
          Promise.resolve(
            memberships
              .filter((item) => item.organizationId === where.organizationId)
              .map((item) => ({
                id: `membership-${item.userId}`,
                userId: item.userId,
                organizationId: item.organizationId,
                role: item.role,
                isDisabled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                  id: item.userId,
                  email: `${item.userId}@example.com`,
                  name: null,
                },
              })),
          ),
        ),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      role: {
        findMany: jest.fn(({ where }: { where: { organizationId: string } }) =>
          Promise.resolve(
            roles
              .filter((item) => item.organizationId === where.organizationId)
              .sort((a, b) => a.name.localeCompare(b.name)),
          ),
        ),
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(roles.find((item) => item.id === where.id) ?? null),
        ),
        findFirst: jest.fn(
          ({
            where,
          }: {
            where: {
              organizationId: string;
              name?: string;
              id?: { not: string };
            };
          }) =>
            Promise.resolve(
              roles.find(
                (item) =>
                  item.organizationId === where.organizationId &&
                  item.name === where.name &&
                  (!where.id?.not || item.id !== where.id.not),
              ) ?? null,
            ),
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: {
              organizationId: string;
              name: string;
              description: string;
              permissions: string;
              isSystem: boolean;
            };
          }) => {
            const created: RoleRow = {
              id: `role-${roles.length + 1}`,
              organizationId: data.organizationId,
              name: data.name,
              description: data.description,
              permissions: data.permissions,
              isSystem: data.isSystem,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            roles.push(created);
            return Promise.resolve(created);
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: { name: string; description: string; permissions: string };
          }) => {
            const index = roles.findIndex((item) => item.id === where.id);

            if (index === -1) {
              return Promise.resolve(null);
            }

            roles[index] = {
              ...roles[index],
              ...data,
              updatedAt: new Date(),
            };

            return Promise.resolve(roles[index]);
          },
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          const index = roles.findIndex((item) => item.id === where.id);

          if (index === -1) {
            return Promise.resolve(null);
          }

          const [removed] = roles.splice(index, 1);
          return Promise.resolve(removed);
        }),
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

  async function loginAndGetToken() {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'actor@example.com', password: 'secure1234' })
      .expect(200);

    return (loginResponse.body as { accessToken: string }).accessToken;
  }

  it('/roles (GET) returns roles list', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .get(`/roles?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          name: 'Administrator',
          isSystem: true,
        }),
      ]),
    });
  });

  it('/roles (POST) creates a custom role', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .post(`/roles?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Field Coordinator',
        description: 'Coordinates field execution',
        permissions: {
          Dashboard: {
            View: true,
            Create: false,
            Edit: false,
            Delete: false,
          },
        },
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Field Coordinator',
        isSystem: false,
      }),
    );
  });

  it('/roles/:id (PUT) updates a role', async () => {
    const token = await loginAndGetToken();

    const created = await request(app.getHttpServer())
      .post(`/roles?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Field Coordinator',
        description: 'Coordinates field execution',
        permissions: {
          Dashboard: {
            View: true,
            Create: false,
            Edit: false,
            Delete: false,
          },
        },
      })
      .expect(201);

    const roleId = (created.body as { id: string }).id;

    const response = await request(app.getHttpServer())
      .put(`/roles/${roleId}?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Field Lead',
        description: 'Updated role name',
        permissions: {
          Dashboard: {
            View: true,
            Create: true,
            Edit: true,
            Delete: false,
          },
        },
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: roleId,
        name: 'Field Lead',
      }),
    );
  });

  it('/roles/:id (DELETE) prevents deleting system roles', async () => {
    const token = await loginAndGetToken();

    await request(app.getHttpServer())
      .delete(`/roles/role-1?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});

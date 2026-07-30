import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TARGET_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('OrganizationUsersController (e2e)', () => {
  let app: INestApplication<App>;

  let users: Array<{
    id: string;
    email: string;
    name: string | null;
    passwordHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;

  let memberships: Array<{
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    isDisabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    users = [
      {
        id: ACTOR_ID,
        email: 'actor@example.com',
        name: 'Actor User',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: TARGET_ID,
        email: 'target@example.com',
        name: 'Target User',
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    memberships = [
      {
        id: 'membership-actor',
        userId: ACTOR_ID,
        organizationId: ORG_ID,
        role: 'Administrator',
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'membership-target',
        userId: TARGET_ID,
        organizationId: ORG_ID,
        role: 'Staff',
        isDisabled: false,
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
                users.find((candidate) => candidate.id === where.id) ?? null,
              );
            }

            if (where.email) {
              return Promise.resolve(
                users.find((candidate) => candidate.email === where.email) ??
                  null,
              );
            }

            return Promise.resolve(null);
          },
        ),
        create: jest.fn(
          ({ data }: { data: { email: string; name?: string | null } }) => {
            const created = {
              id: `user-${users.length + 1}`,
              email: data.email,
              name: data.name ?? null,
              passwordHash: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            users.push(created);
            return Promise.resolve(created);
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: { email?: string; name?: string | null };
          }) => {
            const index = users.findIndex(
              (candidate) => candidate.id === where.id,
            );

            if (index === -1) {
              return Promise.resolve(null);
            }

            users[index] = {
              ...users[index],
              email: data.email ?? users[index].email,
              name: data.name ?? null,
              updatedAt: new Date(),
            };

            return Promise.resolve(users[index]);
          },
        ),
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

            return Promise.resolve(
              memberships.find(
                (candidate) =>
                  candidate.userId === key.userId &&
                  candidate.organizationId === key.organizationId,
              ) ?? null,
            );
          },
        ),
        findMany: jest.fn(
          ({ where }: { where: { organizationId: string } }) => {
            const rows = memberships
              .filter(
                (candidate) =>
                  candidate.organizationId === where.organizationId,
              )
              .map((membership) => ({
                ...membership,
                user: users.find(
                  (candidate) => candidate.id === membership.userId,
                ),
              }));

            return Promise.resolve(rows);
          },
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: { userId: string; organizationId: string; role: string };
          }) => {
            const created = {
              id: `membership-${memberships.length + 1}`,
              userId: data.userId,
              organizationId: data.organizationId,
              role: data.role,
              isDisabled: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            memberships.push(created);

            return Promise.resolve({
              ...created,
              user: users.find((candidate) => candidate.id === data.userId),
            });
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: {
              userId_organizationId: { userId: string; organizationId: string };
            };
            data: { role?: string; isDisabled?: boolean };
          }) => {
            const key = where.userId_organizationId;
            const index = memberships.findIndex(
              (candidate) =>
                candidate.userId === key.userId &&
                candidate.organizationId === key.organizationId,
            );

            if (index === -1) {
              return Promise.resolve(null);
            }

            memberships[index] = {
              ...memberships[index],
              role: data.role ?? memberships[index].role,
              isDisabled: data.isDisabled ?? memberships[index].isDisabled,
              updatedAt: new Date(),
            };

            return Promise.resolve({
              ...memberships[index],
              user: users.find(
                (candidate) => candidate.id === memberships[index].userId,
              ),
            });
          },
        ),
        delete: jest.fn(
          ({
            where,
          }: {
            where: {
              userId_organizationId: { userId: string; organizationId: string };
            };
          }) => {
            const key = where.userId_organizationId;
            const index = memberships.findIndex(
              (candidate) =>
                candidate.userId === key.userId &&
                candidate.organizationId === key.organizationId,
            );

            if (index === -1) {
              return Promise.resolve(null);
            }

            const [removed] = memberships.splice(index, 1);
            return Promise.resolve(removed);
          },
        ),
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

  it('/organization/users (GET) returns users for organization', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .get(`/organization/users?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: ACTOR_ID,
          role: 'Administrator',
          status: 'Active',
        }),
      ]),
    });
  });

  it('/organization/users (POST) invites a user', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .post(`/organization/users?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Member',
        email: 'new.member@example.com',
        role: 'Manager',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: 'new.member@example.com',
        role: 'Manager',
        status: 'Active',
      }),
    );
  });

  it('/organization/users/:userId (PATCH) edits user details', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .patch(`/organization/users/${TARGET_ID}?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Renamed User',
        email: 'renamed@example.com',
        role: 'Manager',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        userId: TARGET_ID,
        name: 'Renamed User',
        email: 'renamed@example.com',
        role: 'Manager',
      }),
    );
  });

  it('/organization/users/:userId/disable (PATCH) disables membership', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .patch(
        `/organization/users/${TARGET_ID}/disable?organizationId=${ORG_ID}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        userId: TARGET_ID,
        status: 'Disabled',
      }),
    );
  });

  it('/organization/users/:userId/enable (PATCH) enables membership', async () => {
    const token = await loginAndGetToken();

    await request(app.getHttpServer())
      .patch(
        `/organization/users/${TARGET_ID}/disable?organizationId=${ORG_ID}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .patch(`/organization/users/${TARGET_ID}/enable?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        userId: TARGET_ID,
        status: 'Active',
      }),
    );
  });

  it('/organization/users/:userId (DELETE) removes membership', async () => {
    const token = await loginAndGetToken();

    await request(app.getHttpServer())
      .delete(`/organization/users/${TARGET_ID}?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const response = await request(app.getHttpServer())
      .get(`/organization/users?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      (response.body as { data: Array<{ userId: string }> }).data,
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: TARGET_ID })]),
    );
  });
});

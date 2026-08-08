import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { buildCorsOptions } from './../src/config/cors.config';
import { PrismaService } from './../src/prisma/prisma.service';

type AuthPrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    upsert: jest.Mock;
  };
  membership: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
  organization: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    upsert: jest.Mock;
  };
  contact: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: AuthPrismaMock;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';

    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      contact: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    prismaService.$transaction.mockImplementation(async (handler: unknown) => {
      if (typeof handler === 'function') {
        const transactionHandler = handler as (
          client: AuthPrismaMock,
        ) => Promise<unknown>;
        return transactionHandler(prismaService);
      }

      return Promise.all(handler as Promise<unknown>[]);
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(buildCorsOptions());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_TOKEN_TTL;
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  function readAccessToken(body: unknown) {
    if (!body || typeof body !== 'object') {
      throw new Error('Expected login response object');
    }

    const accessToken = (body as { accessToken?: unknown }).accessToken;

    if (typeof accessToken !== 'string') {
      throw new Error('Expected accessToken in login response');
    }

    return accessToken;
  }

  it('/auth/register (POST) creates a user account', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'User@Example.com', password: 'secure1234' })
      .expect(201);

    const responseBody = response.body as {
      user: { id: string; email: string; name?: string | null };
    };

    expect(responseBody.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
      }),
    );
    expect(responseBody.user).not.toHaveProperty('passwordHash');
  });

  it('/auth/login (POST) issues a JWT for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secure1234', 12);

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ' User@Example.com ', password: 'secure1234' })
      .expect(200);

    const responseBody = response.body as {
      accessToken: string;
      tokenType: string;
      user: { email: string };
    };

    expect(responseBody.accessToken).toBeDefined();
    expect(responseBody.tokenType).toBe('Bearer');
    expect(responseBody.user.email).toBe('user@example.com');
    expect(responseBody.user).not.toHaveProperty('passwordHash');
  });

  it('/auth/me (GET) returns the authenticated user', async () => {
    const passwordHash = await bcrypt.hash('secure1234', 12);

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secure1234' })
      .expect(200);

    const accessToken = readAccessToken(loginResponse.body as unknown);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
      }),
    );
  });

  it('/auth/me (GET) rejects missing tokens', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('/auth/workspace (GET) returns user and accessible organizations', async () => {
    const passwordHash = await bcrypt.hash('secure1234', 12);

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    prismaService.membership.findMany.mockResolvedValue([
      {
        organization: {
          id: 'org-1',
          name: 'EventOS Pty Ltd',
          slug: 'eventos',
        },
      },
    ]);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secure1234' })
      .expect(200);

    const accessToken = readAccessToken(loginResponse.body as unknown);

    const response = await request(app.getHttpServer())
      .get('/auth/workspace')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.text).toContain('"id":"user-1"');
    expect(response.text).toContain('"email":"user@example.com"');
    expect(response.text).toContain('"id":"org-1"');
    expect(response.text).toContain('"name":"EventOS Pty Ltd"');
    expect(response.text).toContain('"slug":"eventos"');
  });

  it('seeds demo workspace, logs in, loads workspace, and creates contact', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const users: Array<{
      id: string;
      email: string;
      name: string | null;
      passwordHash: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const organizations: Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const memberships: Array<{
      id: string;
      userId: string;
      organizationId: string;
      role: string;
      isDisabled: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const contacts: Array<{
      id: string;
      organizationId: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      mobile: string | null;
      companyName: string | null;
      contactType: string | null;
      address: string | null;
      notes: string | null;
      archivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    prismaService.user.findUnique.mockImplementation(
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
    );

    prismaService.user.upsert.mockImplementation(
      ({
        where,
        create,
        update,
      }: {
        where: { email: string };
        create: { email: string; name: string; passwordHash: string };
        update: { name: string; passwordHash: string };
      }) => {
        const existingIndex = users.findIndex(
          (user) => user.email === where.email,
        );

        if (existingIndex === -1) {
          const now = new Date();
          const createdUser = {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            email: create.email,
            name: create.name,
            passwordHash: create.passwordHash,
            createdAt: now,
            updatedAt: now,
          };
          users.push(createdUser);
          return Promise.resolve(createdUser);
        }

        users[existingIndex] = {
          ...users[existingIndex],
          name: update.name,
          passwordHash: update.passwordHash,
          updatedAt: new Date(),
        };

        return Promise.resolve(users[existingIndex]);
      },
    );

    prismaService.organization.upsert.mockImplementation(
      ({
        where,
        create,
        update,
      }: {
        where: { slug: string };
        create: { name: string; slug: string };
        update: { name: string };
      }) => {
        const existingIndex = organizations.findIndex(
          (organization) => organization.slug === where.slug,
        );

        if (existingIndex === -1) {
          const now = new Date();
          const createdOrganization = {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            name: create.name,
            slug: create.slug,
            createdAt: now,
            updatedAt: now,
          };
          organizations.push(createdOrganization);
          return Promise.resolve(createdOrganization);
        }

        organizations[existingIndex] = {
          ...organizations[existingIndex],
          name: update.name,
          updatedAt: new Date(),
        };

        return Promise.resolve(organizations[existingIndex]);
      },
    );

    prismaService.membership.upsert.mockImplementation(
      ({
        where,
        create,
        update,
      }: {
        where: {
          userId_organizationId: { userId: string; organizationId: string };
        };
        create: {
          userId: string;
          organizationId: string;
          role: string;
          isDisabled: boolean;
        };
        update: { role: string; isDisabled: boolean };
      }) => {
        const existingIndex = memberships.findIndex(
          (membership) =>
            membership.userId === where.userId_organizationId.userId &&
            membership.organizationId ===
              where.userId_organizationId.organizationId,
        );

        if (existingIndex === -1) {
          const now = new Date();
          const createdMembership = {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            userId: create.userId,
            organizationId: create.organizationId,
            role: create.role,
            isDisabled: create.isDisabled,
            createdAt: now,
            updatedAt: now,
          };
          memberships.push(createdMembership);
          return Promise.resolve(createdMembership);
        }

        memberships[existingIndex] = {
          ...memberships[existingIndex],
          role: update.role,
          isDisabled: update.isDisabled,
          updatedAt: new Date(),
        };

        return Promise.resolve(memberships[existingIndex]);
      },
    );

    prismaService.membership.findMany.mockImplementation(
      ({ where }: { where: { userId: string; isDisabled: boolean } }) =>
        Promise.resolve(
          memberships
            .filter(
              (membership) =>
                membership.userId === where.userId &&
                membership.isDisabled === where.isDisabled,
            )
            .map((membership) => {
              const organization = organizations.find(
                (item) => item.id === membership.organizationId,
              );

              return {
                organization: organization ?? {
                  id: 'unknown-org',
                  name: 'Unknown',
                  slug: 'unknown',
                },
              };
            }),
        ),
    );

    prismaService.membership.findUnique.mockImplementation(
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
    );

    prismaService.contact.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          organizationId: string;
          firstName: string;
          lastName?: string | null;
          email?: string | null;
          phone?: string | null;
          mobile?: string | null;
          companyName?: string | null;
          contactType?: string | null;
          address?: string | null;
          notes?: string | null;
        };
      }) => {
        const now = new Date();
        const contact = {
          id: `contact-${contacts.length + 1}`,
          organizationId: data.organizationId,
          firstName: data.firstName,
          lastName: data.lastName ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          mobile: data.mobile ?? null,
          companyName: data.companyName ?? null,
          contactType: data.contactType ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        contacts.push(contact);
        return Promise.resolve(contact);
      },
    );

    prismaService.contact.findMany.mockImplementation(
      ({ where }: { where: { organizationId: string; archivedAt?: null } }) =>
        Promise.resolve(
          contacts
            .filter(
              (contact) =>
                contact.organizationId === where.organizationId &&
                (where.archivedAt === undefined || contact.archivedAt === null),
            )
            .slice()
            .reverse(),
        ),
    );

    const seedResponse = await request(app.getHttpServer())
      .post('/auth/development-seed')
      .expect(200);

    const seedBody = seedResponse.body as {
      accessToken: string;
      organizationId: string;
      user: { email: string };
      organization: { name: string };
    };

    expect(seedBody.accessToken).toBeDefined();
    expect(seedBody.user.email).toBe('demo@eventos.local');
    expect(seedBody.organization.name).toBe('EventOS Demo Organization');
    expect(seedBody.organizationId).toBe(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );

    await request(app.getHttpServer())
      .post('/auth/development-seed')
      .expect(200);

    expect(users).toHaveLength(1);
    expect(organizations).toHaveLength(1);
    expect(memberships).toHaveLength(1);

    const demoLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@eventos.local', password: 'Demo123!ChangeMe' })
      .expect(200);

    const accessToken = readAccessToken(demoLogin.body as unknown);

    const workspaceResponse = await request(app.getHttpServer())
      .get('/auth/workspace')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const workspaceBody = workspaceResponse.body as {
      organizations: Array<{ id: string; name: string }>;
    };

    const organizationId = workspaceBody.organizations[0]?.id;

    expect(workspaceResponse.text).toContain('"email":"demo@eventos.local"');
    expect(workspaceResponse.text).toContain(
      '"name":"EventOS Demo Organization"',
    );
    expect(organizationId).toBeTruthy();

    await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId,
        firstName: 'QA',
        lastName: 'Tester',
        email: 'qa.tester@example.com',
        phone: '0123456789',
      })
      .expect(201);

    const contactsResponse = await request(app.getHttpServer())
      .get('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ organizationId })
      .expect(200);

    expect(contactsResponse.text).toContain('"firstName":"QA"');
    expect(contactsResponse.text).toContain('"email":"qa.tester@example.com"');

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('handles CORS preflight for development seed endpoint', async () => {
    process.env.NODE_ENV = 'development';

    const response = await request(app.getHttpServer())
      .options('/auth/development-seed')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );

    const allowMethods = String(
      response.headers['access-control-allow-methods'] ?? '',
    );
    expect(allowMethods).toContain('POST');
    expect(allowMethods).toContain('OPTIONS');

    const allowHeaders = String(
      response.headers['access-control-allow-headers'] ?? '',
    ).toLowerCase();
    expect(allowHeaders).toContain('content-type');
    expect(allowHeaders).toContain('authorization');

    delete process.env.NODE_ENV;
  });
});

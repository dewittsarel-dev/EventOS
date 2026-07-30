import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type AuthPrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  organization: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: AuthPrismaMock;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
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

    const loginBody = loginResponse.body as { accessToken: string };

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
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
});

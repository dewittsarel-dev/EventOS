import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type OrganizationPrismaMock = {
  organization: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
  $disconnect: jest.Mock;
  $connect: jest.Mock;
};

describe('OrganizationController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: OrganizationPrismaMock;

  beforeEach(async () => {
    prismaService = {
      organization: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'org-1', name: 'EventOS', slug: 'eventos' }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'org-1', name: 'EventOS', slug: 'eventos' },
          ]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'org-1', name: 'EventOS', slug: 'eventos' }),
        update: jest.fn().mockResolvedValue({
          id: 'org-1',
          name: 'Updated Org',
          slug: 'eventos',
        }),
        delete: jest
          .fn()
          .mockResolvedValue({ id: 'org-1', name: 'EventOS', slug: 'eventos' }),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
      $disconnect: jest.fn(),
      $connect: jest.fn(),
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
  });

  it('/organizations (POST) creates an organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'EventOS', slug: 'eventos' })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'EventOS',
        slug: 'eventos',
      }),
    );
  });

  it('/organizations (GET) returns paginated organizations', async () => {
    const response = await request(app.getHttpServer())
      .get('/organizations?page=1&limit=10&name=Event')
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: 'org-1',
          name: 'EventOS',
          slug: 'eventos',
        },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    });
  });

  it('/organizations/:id (GET) returns a stored organization', async () => {
    const response = await request(app.getHttpServer())
      .get('/organizations/org-1')
      .expect(200);

    expect(response.body).toEqual({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
  });
});

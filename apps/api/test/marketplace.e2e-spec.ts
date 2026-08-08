import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Public Marketplace (e2e)', () => {
  let app: INestApplication<App>;
  const itemId = '11111111-1111-4111-8111-111111111111';
  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    inventoryItem: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: itemId, organizationId: 'org-1' }),
    },
    marketplaceEnquiry: {
      create: jest.fn().mockResolvedValue({
        id: 'enquiry-1',
        status: 'New',
        createdAt: new Date('2026-08-08T10:00:00Z'),
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('serves published listings without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/public/marketplace/listings')
      .expect(200);
    expect(response.body).toEqual({ items: [], total: 0, page: 1, limit: 24 });
  });

  it('accepts a valid customer enquiry without exposing private operations', async () => {
    const response = await request(app.getHttpServer())
      .post('/public/marketplace/enquiries')
      .send({
        inventoryItemId: itemId,
        customerName: 'Sam Customer',
        customerEmail: 'sam@example.com',
        quantity: 100,
        message: 'Please confirm availability for our event.',
      })
      .expect(201);
    expect(response.body).toMatchObject({ id: 'enquiry-1', status: 'New' });
    expect(prisma.marketplaceEnquiry.create).toHaveBeenCalled();
  });

  afterAll(async () => app.close());
});

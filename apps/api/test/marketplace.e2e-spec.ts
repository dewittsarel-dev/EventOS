import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Public Marketplace (e2e)', () => {
  let app: INestApplication<App>;
  const itemId = '11111111-1111-4111-8111-111111111111';
  const customerId = '22222222-2222-4222-8222-222222222222';
  let createdEnquiryInput: unknown;
  let createdMessageInput: unknown;
  let registeredCustomer: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    passwordHash: string;
  } | null = null;
  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    resource: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: itemId, organizationId: 'org-1' }),
    },
    marketplaceEnquiry: {
      create: jest.fn((input: unknown) => {
        createdEnquiryInput = input;
        return Promise.resolve({
          id: 'enquiry-1',
          status: 'New',
          createdAt: new Date('2026-08-08T10:00:00Z'),
        });
      }),
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: 'enquiry-1', organizationId: 'org-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    marketplaceEnquiryMessage: {
      create: jest.fn((input: unknown) => {
        createdMessageInput = input;
        return Promise.resolve({
          id: 'message-1',
          authorRole: 'Customer',
          body: 'Is delivery included?',
        });
      }),
    },
    marketplaceCustomer: {
      findUnique: jest.fn(() => Promise.resolve(registeredCustomer)),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            email: string;
            name: string;
            phone?: string;
            passwordHash: string;
          };
        }) => {
          registeredCustomer = {
            id: customerId,
            email: data.email,
            name: data.name,
            phone: data.phone ?? null,
            passwordHash: data.passwordHash,
          };
          return Promise.resolve({
            id: customerId,
            email: data.email,
            name: data.name,
            phone: data.phone ?? null,
          });
        },
      ),
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
        resourceId: itemId,
        customerName: 'Sam Customer',
        customerEmail: 'sam@example.com',
        quantity: 100,
        message: 'Please confirm availability for our event.',
      })
      .expect(201);
    expect(response.body).toMatchObject({ id: 'enquiry-1', status: 'New' });
    expect(prisma.marketplaceEnquiry.create).toHaveBeenCalled();
  });

  it('carries an authenticated customer enquiry and message into the governed workspace', async () => {
    const registration = await request(app.getHttpServer())
      .post('/public/marketplace/customer/register')
      .send({
        name: 'Alex Customer',
        email: 'alex@example.com',
        password: 'secure-pass-123',
      })
      .expect(201);

    const registrationBody = registration.body as unknown;
    if (
      typeof registrationBody !== 'object' ||
      registrationBody === null ||
      !('accessToken' in registrationBody) ||
      typeof registrationBody.accessToken !== 'string'
    ) {
      throw new Error('Registration did not return a customer access token');
    }
    const token = registrationBody.accessToken;
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .post('/public/marketplace/customer/enquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        resourceId: itemId,
        quantity: 100,
        message: 'Please quote for our reception.',
      })
      .expect(201);

    expect(createdEnquiryInput).toMatchObject({
      data: {
        customerId,
        customerName: 'Alex Customer',
        customerEmail: 'alex@example.com',
      },
    });

    await request(app.getHttpServer())
      .post(
        '/public/marketplace/customer/enquiries/11111111-1111-4111-8111-111111111111/messages',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Is delivery included?' })
      .expect(201);

    expect(createdMessageInput).toMatchObject({
      data: {
        authorCustomerId: customerId,
        body: 'Is delivery included?',
      },
    });
  });

  afterAll(async () => app.close());
});

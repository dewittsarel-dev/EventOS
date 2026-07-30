import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('OrganizationSettingsController (e2e)', () => {
  let app: INestApplication<App>;

  let organizationRecord: {
    id: string;
    name: string;
    slug: string;
    tradingName: string | null;
    vatNumber: string | null;
    registrationNumber: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    physicalAddress: string | null;
    postalAddress: string | null;
    logoUrl: string | null;
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    organizationRecord = {
      id: ORG_ID,
      name: 'EventOS Pty Ltd',
      slug: 'eventos',
      tradingName: null,
      vatNumber: null,
      registrationNumber: null,
      email: 'ops@eventos.example',
      phone: null,
      website: null,
      physicalAddress: null,
      postalAddress: null,
      logoUrl: null,
    };

    const prismaMock = {
      user: {
        findUnique: jest.fn(
          ({ where }: { where: { id?: string; email?: string } }) => {
            if (where.id === USER_ID || where.email === 'user1@example.com') {
              return Promise.resolve({
                id: USER_ID,
                email: 'user1@example.com',
                name: null,
                passwordHash,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }

            return Promise.resolve(null);
          },
        ),
        create: jest.fn(),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([organizationRecord]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            where.id === ORG_ID ? { ...organizationRecord } : null,
          ),
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            if (where.id !== ORG_ID) {
              return Promise.resolve(null);
            }

            organizationRecord = {
              ...organizationRecord,
              ...data,
            };

            return Promise.resolve({ ...organizationRecord });
          },
        ),
        create: jest.fn().mockResolvedValue(organizationRecord),
        delete: jest.fn().mockResolvedValue(organizationRecord),
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
            if (key.userId === USER_ID && key.organizationId === ORG_ID) {
              return Promise.resolve({
                id: 'membership-1',
                userId: USER_ID,
                organizationId: ORG_ID,
                role: 'owner',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }

            return Promise.resolve(null);
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
      .send({ email: 'user1@example.com', password: 'secure1234' })
      .expect(200);

    return (loginResponse.body as { accessToken: string }).accessToken;
  }

  it('/organization (GET) returns organization settings', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .get(`/organization?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: ORG_ID,
        name: 'EventOS Pty Ltd',
        slug: 'eventos',
        email: 'ops@eventos.example',
      }),
    );
  });

  it('/organization (PUT) updates organization settings', async () => {
    const token = await loginAndGetToken();

    const payload = {
      companyName: 'EventOS Holdings',
      tradingName: 'EventOS',
      vatNumber: 'VAT-12345',
      registrationNumber: 'REG-98765',
      email: 'finance@eventos.example',
      phone: '+27 11 555 0100',
      website: 'https://eventos.example',
      physicalAddress: '1 Harbour Road',
      postalAddress: 'PO Box 100',
    };

    const response = await request(app.getHttpServer())
      .put(`/organization?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: ORG_ID,
        name: 'EventOS Holdings',
        tradingName: 'EventOS',
        vatNumber: 'VAT-12345',
        registrationNumber: 'REG-98765',
        email: 'finance@eventos.example',
        phone: '+27 11 555 0100',
        website: 'https://eventos.example',
      }),
    );
  });

  it('/organization (PUT) validates required companyName and email', async () => {
    const token = await loginAndGetToken();

    await request(app.getHttpServer())
      .put(`/organization?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: '',
        email: 'invalid-email',
      })
      .expect(400);
  });

  it('/organization/logo (PATCH) updates logo placeholder URL', async () => {
    const token = await loginAndGetToken();

    const response = await request(app.getHttpServer())
      .patch(`/organization/logo?organizationId=${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ logoUrl: 'https://cdn.example.com/eventos-logo.png' })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: ORG_ID,
        logoUrl: 'https://cdn.example.com/eventos-logo.png',
      }),
    );
  });
});

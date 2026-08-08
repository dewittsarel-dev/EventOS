import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { SupplierCategory } from './../src/suppliers/dto/supplier-category.enum';

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

type SupplierRecord = {
  id: string;
  organizationId: string;
  companyName: string;
  category: SupplierCategory;
  primaryContactName: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  physicalAddress: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  preferredSupplier: boolean;
  active: boolean;
  preferredPaymentTerms: string | null;
  internalRating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PurchaseOrderRecord = {
  id: string;
  organizationId: string;
  supplierId: string;
};

type InventoryItemRecord = {
  id: string;
  organizationId: string;
  preferredSupplierId: string | null;
};

type SupplierQuotationRecord = {
  id: string;
  supplierId: string;
};

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';

function makeSupplier(overrides: Partial<SupplierRecord> = {}): SupplierRecord {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    organizationId: ORG_1,
    companyName: 'Sunrise Catering Co.',
    category: SupplierCategory.Catering,
    primaryContactName: 'Maya Jacobs',
    phone: '+27 21 555 1234',
    mobile: '+27 82 000 0000',
    email: 'hello@sunrise-catering.co.za',
    website: 'https://sunrise-catering.co.za',
    physicalAddress: '12 Harbour Road',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    vatNumber: '4010123456',
    registrationNumber: '2019/123456/07',
    preferredSupplier: false,
    active: true,
    preferredPaymentTerms: '30 days EOM',
    internalRating: 4,
    notes: 'Reliable supplier',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SuppliersController (e2e)', () => {
  let app: INestApplication<App>;

  let users: UserRecord[];
  let memberships: MembershipRecord[];
  let suppliers: SupplierRecord[];
  let purchaseOrders: PurchaseOrderRecord[];
  let inventoryItems: InventoryItemRecord[];
  let supplierQuotations: SupplierQuotationRecord[];

  let supplierSequence = 0;

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

    suppliers = [
      makeSupplier({
        id: '44444444-4444-4444-8444-444444444444',
        companyName: 'Alpha Venue Co.',
        category: SupplierCategory.Venue,
        city: 'Johannesburg',
      }),
      makeSupplier({
        id: '55555555-5555-4555-8555-555555555555',
        companyName: 'Bloom Florals',
        category: SupplierCategory.Florist,
        preferredSupplier: true,
        internalRating: 5,
        city: 'Cape Town',
      }),
    ];

    purchaseOrders = [];
    inventoryItems = [];
    supplierQuotations = [];

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
      supplier: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<SupplierRecord, 'id' | 'createdAt' | 'updatedAt'>;
          }) => {
            supplierSequence += 1;
            const supplier = makeSupplier({
              id: `supplier-${supplierSequence}`,
              ...data,
            });
            suppliers.unshift(supplier);
            return Promise.resolve({
              ...supplier,
              organization: {
                id: supplier.organizationId,
                name: supplier.organizationId === ORG_1 ? 'Org 1' : 'Org 2',
              },
            });
          },
        ),
        findMany: jest.fn(
          ({
            where,
            orderBy,
            skip,
            take,
          }: {
            where: {
              organizationId: string;
              OR?: Array<{
                companyName?: { contains: string; mode: 'insensitive' };
                primaryContactName?: { contains: string; mode: 'insensitive' };
                email?: { contains: string; mode: 'insensitive' };
                phone?: { contains: string; mode: 'insensitive' };
                mobile?: { contains: string; mode: 'insensitive' };
                city?: { contains: string; mode: 'insensitive' };
              }>;
              category?: SupplierCategory;
              preferredSupplier?: boolean;
              active?: boolean;
            };
            orderBy: Array<Record<string, 'asc' | 'desc'>>;
            skip: number;
            take: number;
          }) => {
            let result = suppliers.filter(
              (supplier) => supplier.organizationId === where.organizationId,
            );

            const search = where.OR?.[0]?.companyName?.contains;
            if (search) {
              const needle = search.toLowerCase();
              result = result.filter((supplier) =>
                [
                  supplier.companyName,
                  supplier.primaryContactName ?? '',
                  supplier.email ?? '',
                  supplier.phone ?? '',
                  supplier.mobile ?? '',
                  supplier.city ?? '',
                ]
                  .join(' ')
                  .toLowerCase()
                  .includes(needle),
              );
            }

            if (where.category) {
              result = result.filter(
                (supplier) => supplier.category === where.category,
              );
            }

            if (where.preferredSupplier !== undefined) {
              result = result.filter(
                (supplier) =>
                  supplier.preferredSupplier === where.preferredSupplier,
              );
            }

            if (where.active !== undefined) {
              result = result.filter(
                (supplier) => supplier.active === where.active,
              );
            }

            const [firstOrderBy] = orderBy;
            if (firstOrderBy?.createdAt) {
              result = result.sort((left, right) =>
                firstOrderBy.createdAt === 'asc'
                  ? left.createdAt.getTime() - right.createdAt.getTime()
                  : right.createdAt.getTime() - left.createdAt.getTime(),
              );
            } else if (firstOrderBy?.internalRating) {
              result = result.sort(
                (left, right) =>
                  (right.internalRating ?? 0) - (left.internalRating ?? 0),
              );
            } else {
              result = result.sort((left, right) =>
                left.companyName.localeCompare(right.companyName),
              );
            }

            return Promise.resolve(
              result.slice(skip, skip + take).map((supplier) => ({
                ...supplier,
                organization: {
                  id: supplier.organizationId,
                  name: supplier.organizationId === ORG_1 ? 'Org 1' : 'Org 2',
                },
              })),
            );
          },
        ),
        count: jest.fn(({ where }: { where: { organizationId: string } }) =>
          Promise.resolve(
            suppliers.filter(
              (supplier) => supplier.organizationId === where.organizationId,
            ).length,
          ),
        ),
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          const supplier =
            suppliers.find((entry) => entry.id === where.id) ?? null;

          if (!supplier) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            ...supplier,
            organization: {
              id: supplier.organizationId,
              name: supplier.organizationId === ORG_1 ? 'Org 1' : 'Org 2',
            },
          });
        }),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<SupplierRecord>;
          }) => {
            const index = suppliers.findIndex(
              (supplier) => supplier.id === where.id,
            );

            if (index === -1) {
              return Promise.resolve(null);
            }

            const updated: SupplierRecord = {
              ...suppliers[index],
              ...data,
              updatedAt: new Date(),
            };

            suppliers[index] = updated;

            return Promise.resolve({
              ...updated,
              organization: {
                id: updated.organizationId,
                name: updated.organizationId === ORG_1 ? 'Org 1' : 'Org 2',
              },
            });
          },
        ),
        findFirst: jest.fn(
          ({
            where,
          }: {
            where: {
              organizationId: string;
              vatNumber?: { equals: string; mode: 'insensitive' };
              registrationNumber?: { equals: string; mode: 'insensitive' };
              id?: { not: string };
            };
          }) => {
            const match = suppliers.find((supplier) => {
              if (supplier.organizationId !== where.organizationId) {
                return false;
              }

              if (where.id?.not && supplier.id === where.id.not) {
                return false;
              }

              if (where.vatNumber) {
                return (
                  (supplier.vatNumber ?? '').toLowerCase() ===
                  where.vatNumber.equals.toLowerCase()
                );
              }

              if (where.registrationNumber) {
                return (
                  (supplier.registrationNumber ?? '').toLowerCase() ===
                  where.registrationNumber.equals.toLowerCase()
                );
              }

              return false;
            });

            return Promise.resolve(match ? { id: match.id } : null);
          },
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          const supplier = suppliers.find((entry) => entry.id === where.id);
          suppliers = suppliers.filter((entry) => entry.id !== where.id);
          return Promise.resolve(supplier);
        }),
      },
      purchaseOrder: {
        count: jest.fn(
          ({
            where,
          }: {
            where: { organizationId: string; supplierId: string };
          }) =>
            Promise.resolve(
              purchaseOrders.filter(
                (order) =>
                  order.organizationId === where.organizationId &&
                  order.supplierId === where.supplierId,
              ).length,
            ),
        ),
      },
      inventoryItem: {
        count: jest.fn(
          ({
            where,
          }: {
            where: { organizationId: string; preferredSupplierId: string };
          }) =>
            Promise.resolve(
              inventoryItems.filter(
                (item) =>
                  item.organizationId === where.organizationId &&
                  item.preferredSupplierId === where.preferredSupplierId,
              ).length,
            ),
        ),
      },
      supplierQuotation: {
        count: jest.fn(({ where }: { where: { supplierId: string } }) =>
          Promise.resolve(
            supplierQuotations.filter(
              (link) => link.supplierId === where.supplierId,
            ).length,
          ),
        ),
      },
      organization: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'secure1234' })
      .expect(200);

    const body = response.body as { accessToken: string };

    return body.accessToken;
  }

  it('supports create, list with filtering, get, update and archive', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        companyName: '  Nova Security  ',
        category: SupplierCategory.Security,
        email: 'ops@nova-security.co.za',
        internalRating: 5,
        preferredSupplier: true,
      })
      .expect(201);

    const created = createdResponse.body as SupplierRecord;
    expect(created.companyName).toBe('Nova Security');

    const listResponse = await request(app.getHttpServer())
      .get('/suppliers')
      .query({
        organizationId: ORG_1,
        page: 1,
        limit: 2,
        search: 'nova',
        category: SupplierCategory.Security,
        preferredSupplier: true,
        active: true,
        sortBy: 'companyName',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = listResponse.body as {
      data: SupplierRecord[];
      meta: { page: number; limit: number; total: number };
    };

    expect(listBody.meta.page).toBe(1);
    expect(listBody.data[0]?.companyName).toContain('Nova');

    await request(app.getHttpServer())
      .get(`/suppliers/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/suppliers/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        internalRating: 4,
        city: 'Johannesburg',
      })
      .expect(200);

    expect(updatedResponse.body).toEqual(
      expect.objectContaining({
        internalRating: 4,
        city: 'Johannesburg',
      }),
    );

    const archivedResponse = await request(app.getHttpServer())
      .patch(`/suppliers/${created.id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(archivedResponse.body).toEqual(
      expect.objectContaining({
        active: false,
      }),
    );

    const archivedListResponse = await request(app.getHttpServer())
      .get('/suppliers')
      .query({
        organizationId: ORG_1,
        active: false,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const archivedListBody = archivedListResponse.body as {
      data: SupplierRecord[];
    };

    expect(archivedListBody.data.some((item) => item.id === created.id)).toBe(
      true,
    );
  });

  it('accepts Lighting category and normalizes website without protocol', async () => {
    const token = await login('user1@example.com');

    const createdResponse = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        companyName: 'CuStech Lighting',
        category: SupplierCategory.Lighting,
        website: 'www.custechonline.com',
      })
      .expect(201);

    expect(createdResponse.body).toEqual(
      expect.objectContaining({
        category: SupplierCategory.Lighting,
        website: 'https://www.custechonline.com',
      }),
    );
  });

  it('blocks delete when supplier has dependencies', async () => {
    const token = await login('user1@example.com');

    const supplier = makeSupplier({
      id: 'supplier-with-po',
    });

    suppliers.push(supplier);

    purchaseOrders.push({
      id: 'po-1',
      organizationId: ORG_1,
      supplierId: supplier.id,
    });

    await request(app.getHttpServer())
      .delete(`/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });

  it('enforces authentication and organization isolation', async () => {
    const tokenUser2 = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/suppliers')
      .query({ organizationId: ORG_1 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/suppliers')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(403);
  });

  it('validates payloads', async () => {
    const token = await login('user1@example.com');

    await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        companyName: '',
        category: SupplierCategory.Catering,
        internalRating: 9,
      })
      .expect(400);
  });
});

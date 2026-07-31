import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';
const EVENT_1 = '33333333-3333-4333-8333-333333333333';

describe('MeetingNotesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';

    const passwordHash = await bcrypt.hash('secure1234', 12);

    const users = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'user1@example.com',
        name: 'User One',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'user2@example.com',
        name: 'User Two',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const memberships = [
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

    const notes: Array<Record<string, unknown>> = [];

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
      event: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          if (where.id !== EVENT_1) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            id: EVENT_1,
            organizationId: ORG_1,
            title: 'Launch Event',
          });
        }),
      },
      task: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      meetingNote: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: MeetingNoteCreateMockData }) => {
              const note = {
                id: `note-${notes.length + 1}`,
                organizationId: data.organizationId,
                eventId: data.eventId,
                title: data.title,
                meetingDate: data.meetingDate,
                startTime: data.startTime ?? null,
                endTime: data.endTime ?? null,
                location: data.location ?? null,
                meetingType: data.meetingType,
                summary: data.summary ?? null,
                discussionNotes: data.discussionNotes ?? null,
                decisions: data.decisions ?? null,
                nextMeetingDate: data.nextMeetingDate ?? null,
                createdByUserId: data.createdByUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                organization: { id: ORG_1, name: 'Org One' },
                event: { id: EVENT_1, title: 'Launch Event' },
                createdBy: {
                  id: users[0].id,
                  name: 'User One',
                  email: 'user1@example.com',
                },
                attendees: [],
                actionItems: [],
              };
              notes.push(note);
              return note;
            },
          ),
        findMany: jest.fn().mockImplementation(() => notes),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest
          .fn()
          .mockImplementation(
            ({ where }: { where: { id: string } }) =>
              notes.find((note) => note.id === where.id) ?? null,
          ),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      meetingAttendee: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      meetingActionItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

    type MeetingNoteCreateMockData = {
      organizationId: string;
      eventId: string;
      title: string;
      meetingDate: string;
      startTime?: string | null;
      endTime?: string | null;
      location?: string | null;
      meetingType: string;
      summary?: string | null;
      discussionNotes?: string | null;
      decisions?: string | null;
      nextMeetingDate?: string | null;
      createdByUserId: string;
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

    const responseBody = response.body as Record<string, unknown>;
    const accessToken = responseBody.accessToken;

    if (typeof accessToken !== 'string') {
      throw new Error('Expected accessToken in login response');
    }

    return accessToken;
  }

  it('creates and lists meeting notes', async () => {
    const token = await login('user1@example.com');

    const created = await request(app.getHttpServer())
      .post('/meeting-notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        organizationId: ORG_1,
        eventId: EVENT_1,
        title: 'Kickoff',
        meetingDate: '2026-08-01T09:00:00.000Z',
        meetingType: 'Client Meeting',
      })
      .expect(201);

    const createdBody = created.body as { title?: string };

    expect(createdBody.title).toBe('Kickoff');

    const list = await request(app.getHttpServer())
      .get('/meeting-notes')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = list.body as { data?: unknown[] };

    expect(Array.isArray(listBody.data)).toBe(true);
  });

  it('enforces organization isolation', async () => {
    const token = await login('user2@example.com');

    await request(app.getHttpServer())
      .get('/meeting-notes')
      .query({ organizationId: ORG_1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

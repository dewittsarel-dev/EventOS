import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
    organization: {
      upsert: jest.Mock;
    };
    membership: {
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      organization: {
        upsert: jest.fn(),
      },
      membership: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(async (handler: unknown) => {
      if (typeof handler === 'function') {
        const transactionHandler = handler as (
          client: typeof prisma,
        ) => Promise<unknown>;
        return transactionHandler(prisma);
      }

      return Promise.all(handler as Promise<unknown>[]);
    });
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    configService = {
      get: jest.fn().mockReturnValue('15m'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user with a normalized email and hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.register({
      email: ' User@Example.com ',
      password: 'secure1234',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('secure1234', 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: 'hashed-password',
      },
    });
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
      }),
    );
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email during registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({ email: 'user@example.com', password: 'secure1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs in a user and returns a JWT access token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: ' User@Example.com ',
      password: 'secure1234',
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        email: 'user@example.com',
      },
      {
        expiresIn: 900,
      },
    );
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
      }),
    );
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid login credentials with a generic unauthorized response', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('seeds deterministic development workspace in development mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    (bcrypt.hash as jest.Mock).mockResolvedValue('demo-hash');

    prisma.user.upsert.mockResolvedValue({
      id: 'demo-user-id',
      email: 'demo@eventos.local',
      name: 'Demo Administrator',
      passwordHash: 'demo-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    prisma.organization.upsert.mockResolvedValue({
      id: 'demo-org-id',
      name: 'EventOS Demo Organization',
      slug: 'eventos-demo-organization',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    prisma.membership.upsert.mockResolvedValue({
      id: 'membership-1',
      role: 'administrator',
      isDisabled: false,
      userId: 'demo-user-id',
      organizationId: 'demo-org-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await service.seedDevelopmentWorkspace();

    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.organization.upsert).toHaveBeenCalled();
    expect(prisma.membership.upsert).toHaveBeenCalled();
    expect(response.accessToken).toBe('signed-token');
    expect(response.tokenType).toBe('Bearer');
    expect(response.expiresIn).toBe(900);
    expect(response.user.email).toBe('demo@eventos.local');
    expect(response.organization.name).toBe('EventOS Demo Organization');
    expect(response.organizationId).toBe('demo-org-id');
    expect(response.organizations).toEqual([
      {
        id: 'demo-org-id',
        name: 'EventOS Demo Organization',
        slug: 'eventos-demo-organization',
      },
    ]);
    expect(response.membershipRole).toBe('administrator');

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  let prismaService: { $queryRawUnsafe: jest.Mock; $disconnect: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('returns database-connected health status', async () => {
    const health = await controller.getHealth();

    expect(health).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'eventos-api',
        version: '0.1.0',
        database: 'connected',
      }),
    );
  });

  it('reports process liveness without requiring the database', () => {
    expect(controller.getLiveness()).toEqual(
      expect.objectContaining({ status: 'alive' }),
    );
  });

  it('rejects readiness when the database is unavailable', async () => {
    prismaService.$queryRawUnsafe.mockRejectedValueOnce(new Error('offline'));

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

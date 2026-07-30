import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');

      return {
        status: 'ok',
        service: 'eventos-api',
        version: '0.1.0',
        database: 'connected',
      };
    } catch {
      return {
        status: 'ok',
        service: 'eventos-api',
        version: '0.1.0',
        database: 'disconnected',
      };
    }
  }
}

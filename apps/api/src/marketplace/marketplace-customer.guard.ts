import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceCustomerGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { marketplaceCustomer?: unknown }>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token)
      throw new UnauthorizedException('Marketplace customer sign-in required');
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        audience: string;
      }>(token);
      if (payload.audience !== 'marketplace-customer')
        throw new Error('Invalid audience');
      const customer = await this.prisma.marketplaceCustomer.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, phone: true },
      });
      if (!customer) throw new Error('Customer not found');
      request.marketplaceCustomer = customer;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired Marketplace customer session',
      );
    }
  }
}

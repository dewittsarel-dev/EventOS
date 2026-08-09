import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedMarketplaceCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

export const CurrentMarketplaceCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context
      .switchToHttp()
      .getRequest<
        Request & { marketplaceCustomer: AuthenticatedMarketplaceCustomer }
      >().marketplaceCustomer,
);

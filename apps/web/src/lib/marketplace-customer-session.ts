import type { MarketplaceCustomerSession } from './marketplace-public-types';

const KEY = 'eventos.marketplace.customer';
export const readMarketplaceCustomerSession = (): MarketplaceCustomerSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as MarketplaceCustomerSession | null;
  } catch {
    return null;
  }
};
export const writeMarketplaceCustomerSession = (session: MarketplaceCustomerSession) => window.localStorage.setItem(KEY, JSON.stringify(session));
export const clearMarketplaceCustomerSession = () => window.localStorage.removeItem(KEY);

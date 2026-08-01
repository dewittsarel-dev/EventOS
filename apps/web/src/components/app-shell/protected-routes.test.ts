import { describe, expect, it } from 'vitest';
import { buildLoginRedirectPath, isProtectedAppPath } from './protected-routes';

describe('protected routes', () => {
  it('protects operational routes including nested and settings paths', () => {
    expect(isProtectedAppPath('/')).toBe(true);
    expect(isProtectedAppPath('/dashboard')).toBe(true);
    expect(isProtectedAppPath('/suppliers')).toBe(true);
    expect(isProtectedAppPath('/suppliers/new')).toBe(true);
    expect(isProtectedAppPath('/suppliers/s-1/edit')).toBe(true);
    expect(isProtectedAppPath('/inventory')).toBe(true);
    expect(isProtectedAppPath('/inventory/items/new')).toBe(true);
    expect(isProtectedAppPath('/purchase-orders')).toBe(true);
    expect(isProtectedAppPath('/purchase-orders/new')).toBe(true);
    expect(isProtectedAppPath('/goods-receipts')).toBe(true);
    expect(isProtectedAppPath('/goods-receipts/gr-1')).toBe(true);
    expect(isProtectedAppPath('/quotations')).toBe(true);
    expect(isProtectedAppPath('/quotations/q-1/edit')).toBe(true);
    expect(isProtectedAppPath('/tasks')).toBe(true);
    expect(isProtectedAppPath('/tasks/timeline')).toBe(true);
    expect(isProtectedAppPath('/settings/users')).toBe(true);
  });

  it('does not protect public login and marketplace paths', () => {
    expect(isProtectedAppPath('/login')).toBe(false);
    expect(isProtectedAppPath('/marketplace')).toBe(false);
    expect(isProtectedAppPath('/marketplace/coming-soon')).toBe(false);
  });

  it('preserves next path and query for login redirects', () => {
    expect(buildLoginRedirectPath('/tasks/timeline', '?status=Todo')).toBe(
      '/login?next=%2Ftasks%2Ftimeline%3Fstatus%3DTodo',
    );
    expect(buildLoginRedirectPath('/suppliers/new', '')).toBe(
      '/login?next=%2Fsuppliers%2Fnew',
    );
  });
});

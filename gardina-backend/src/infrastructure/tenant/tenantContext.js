import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped tenant (organization) id for multi-tenant SaaS queries.
 * Bound in auth middleware after the user is loaded from DB.
 */
export const tenantStorage = new AsyncLocalStorage();

export function getTenantId() {
  const store = tenantStorage.getStore();
  if (!store?.organizationId) {
    throw new Error('Tenant context is not initialized');
  }
  return store.organizationId;
}

/**
 * tests/unit/lib/rbac.test.ts
 * ──────────────────────────────────────────────────────────────
 * Unit tests for lib/rbac.ts — the SINGLE SOURCE OF TRUTH for
 * route-based access control in the LegacyMark platform.
 *
 * Priority: CRITICAL — a bug here is a security incident.
 *
 * Test coverage targets:
 *  - isPublicRoute()       → 100% branch coverage
 *  - isStandardRole()      → 100% branch coverage
 *  - canAccessRoute()      → 100% branch coverage per role
 *  - canCustomRoleAccess() → 100% branch coverage (edge cases)
 *  - getAccessibleRoutes() → smoke tests
 */
import { describe, it, expect } from 'vitest';

import {
  isPublicRoute,
  isStandardRole,
  canAccessRoute,
  canCustomRoleAccess,
  getAccessibleRoutes,
  PUBLIC_ROUTES,
  PUBLIC_PREFIXES,
  ROUTE_PERMISSIONS,
} from '@/lib/rbac';
import { UserRole } from '@/types/auth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// isPublicRoute()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('isPublicRoute()', () => {
  describe('exact matches against PUBLIC_ROUTES', () => {
    it.each(PUBLIC_ROUTES)('returns true for "%s"', (route) => {
      expect(isPublicRoute(route)).toBe(true);
    });
  });

  describe('prefix matches against PUBLIC_PREFIXES', () => {
    it('matches a blog slug under /blog/', () => {
      expect(isPublicRoute('/blog/como-crear-una-pagina-web')).toBe(true);
    });

    it('matches a portfolio slug under /portfolio/', () => {
      expect(isPublicRoute('/portfolio/proyecto-legacymark')).toBe(true);
    });

    it('matches a webhook under /api/webhooks/', () => {
      expect(isPublicRoute('/api/webhooks/whatsapp')).toBe(true);
      expect(isPublicRoute('/api/webhooks/channels/meta')).toBe(true);
    });

    it('matches a lead creation endpoint under /api/leads/', () => {
      expect(isPublicRoute('/api/leads/create')).toBe(true);
    });

    it('matches an analytics endpoint under /api/analytics/', () => {
      expect(isPublicRoute('/api/analytics/event')).toBe(true);
    });
  });

  describe('protected routes — must return false', () => {
    it('rejects /dashboard', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
    });

    it('rejects /dashboard/admin/crm', () => {
      expect(isPublicRoute('/dashboard/admin/crm')).toBe(false);
    });

    it('rejects /dashboard/security', () => {
      expect(isPublicRoute('/dashboard/security')).toBe(false);
    });

    it('rejects /dashboard/admin/payroll', () => {
      expect(isPublicRoute('/dashboard/admin/payroll')).toBe(false);
    });

    it('does not match /blog without trailing slash (not a prefix match)', () => {
      // /blog is an exact match in PUBLIC_ROUTES, not a prefix
      // /bloguero should NOT match the /blog prefix
      expect(isPublicRoute('/bloguero')).toBe(false);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// isStandardRole()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('isStandardRole()', () => {
  it('returns true for all enum values', () => {
    Object.values(UserRole).forEach((role) => {
      expect(isStandardRole(role)).toBe(true);
    });
  });

  it('returns false for custom role strings', () => {
    expect(isStandardRole('supervisor_ventas')).toBe(false);
    expect(isStandardRole('diseñador_sr')).toBe(false);
    expect(isStandardRole('')).toBe(false);
    expect(isStandardRole('super_admin_fake')).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — SUPER_ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — SUPER_ADMIN', () => {
  it('grants access to every known ROUTE_PERMISSIONS key', () => {
    Object.keys(ROUTE_PERMISSIONS).forEach((route) => {
      expect(canAccessRoute(route, UserRole.SUPER_ADMIN)).toBe(true);
    });
  });

  it('grants access to arbitrary unknown routes', () => {
    expect(canAccessRoute('/dashboard/some/unknown/route', UserRole.SUPER_ADMIN)).toBe(true);
    expect(canAccessRoute('/any/completely/random/path', UserRole.SUPER_ADMIN)).toBe(true);
  });

  it('also accepts the string literal "super_admin"', () => {
    expect(canAccessRoute('/dashboard/security', 'super_admin')).toBe(true);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — GUEST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — GUEST', () => {
  it('blocks access to every dashboard route', () => {
    Object.keys(ROUTE_PERMISSIONS).forEach((route) => {
      expect(canAccessRoute(route, UserRole.GUEST)).toBe(false);
    });
  });

  it('also accepts the string literal "guest"', () => {
    expect(canAccessRoute('/dashboard', 'guest')).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — ADMIN', () => {
  it('allows access to management routes', () => {
    expect(canAccessRoute('/dashboard/users', UserRole.ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/settings', UserRole.ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/analytics', UserRole.ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/marketing', UserRole.ADMIN)).toBe(true);
  });

  it('BLOCKS access to SUPER_ADMIN-only routes', () => {
    expect(canAccessRoute('/dashboard/security', UserRole.ADMIN)).toBe(false);
  });

  it('BLOCKS access to EXTERNAL_CLIENT route', () => {
    expect(canAccessRoute('/dashboard/client', UserRole.ADMIN)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — CONTENT_MANAGER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — CONTENT_MANAGER', () => {
  it('allows access to content and analytics routes', () => {
    expect(canAccessRoute('/dashboard/posts', UserRole.CONTENT_MANAGER)).toBe(true);
    expect(canAccessRoute('/dashboard/posts/create', UserRole.CONTENT_MANAGER)).toBe(true);
    expect(canAccessRoute('/dashboard/analytics', UserRole.CONTENT_MANAGER)).toBe(true);
    expect(canAccessRoute('/dashboard/marketing', UserRole.CONTENT_MANAGER)).toBe(true);
  });

  it('BLOCKS access to financial and user management routes', () => {
    expect(canAccessRoute('/dashboard/admin/payroll', UserRole.CONTENT_MANAGER)).toBe(false);
    expect(canAccessRoute('/dashboard/admin/treasury', UserRole.CONTENT_MANAGER)).toBe(false);
    expect(canAccessRoute('/dashboard/users', UserRole.CONTENT_MANAGER)).toBe(false);
    expect(canAccessRoute('/dashboard/security', UserRole.CONTENT_MANAGER)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — CLIENT_ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — CLIENT_ADMIN', () => {
  it('allows access to CRM routes', () => {
    expect(canAccessRoute('/dashboard/admin/crm', UserRole.CLIENT_ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/admin/crm/leads', UserRole.CLIENT_ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/admin/crm/pipeline', UserRole.CLIENT_ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/inbox', UserRole.CLIENT_ADMIN)).toBe(true);
  });

  it('BLOCKS access to financial admin routes', () => {
    expect(canAccessRoute('/dashboard/admin/payroll', UserRole.CLIENT_ADMIN)).toBe(false);
    expect(canAccessRoute('/dashboard/admin/treasury', UserRole.CLIENT_ADMIN)).toBe(false);
  });

  it('BLOCKS access to user management', () => {
    expect(canAccessRoute('/dashboard/users', UserRole.CLIENT_ADMIN)).toBe(false);
    expect(canAccessRoute('/dashboard/security', UserRole.CLIENT_ADMIN)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — CLIENT_USER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — CLIENT_USER', () => {
  it('allows access to basic content routes', () => {
    expect(canAccessRoute('/dashboard', UserRole.CLIENT_USER)).toBe(true);
    expect(canAccessRoute('/dashboard/posts', UserRole.CLIENT_USER)).toBe(true);
    expect(canAccessRoute('/dashboard/projects', UserRole.CLIENT_USER)).toBe(true);
  });

  it('BLOCKS access to all privileged routes', () => {
    expect(canAccessRoute('/dashboard/admin/payroll', UserRole.CLIENT_USER)).toBe(false);
    expect(canAccessRoute('/dashboard/admin/treasury', UserRole.CLIENT_USER)).toBe(false);
    expect(canAccessRoute('/dashboard/security', UserRole.CLIENT_USER)).toBe(false);
    expect(canAccessRoute('/dashboard/users', UserRole.CLIENT_USER)).toBe(false);
    expect(canAccessRoute('/dashboard/admin/crm', UserRole.CLIENT_USER)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — Prefix inheritance for unlisted sub-routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — prefix inheritance', () => {
  it('inherits CRM parent permissions for unlisted sub-routes', () => {
    // /dashboard/admin/crm/reports is not in ROUTE_PERMISSIONS
    // but should inherit from /dashboard/admin/crm
    expect(canAccessRoute('/dashboard/admin/crm/reports', UserRole.SUPER_ADMIN)).toBe(true);
    expect(canAccessRoute('/dashboard/admin/crm/reports', UserRole.CLIENT_ADMIN)).toBe(true);
  });

  it('inherits marketing parent permissions for unlisted sub-routes', () => {
    expect(canAccessRoute('/dashboard/marketing/new-feature', UserRole.ADMIN)).toBe(true);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canCustomRoleAccess() — CRITICAL EDGE CASES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canCustomRoleAccess() — edge cases', () => {
  const allowedRoutes = [
    '/dashboard',
    '/dashboard/admin/crm',
    '/dashboard/posts',
  ];

  it('allows exact match', () => {
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/admin/crm')).toBe(true);
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/posts')).toBe(true);
  });

  it('allows sub-path access under an allowed route', () => {
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/admin/crm/leads')).toBe(true);
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/admin/crm/pipeline')).toBe(true);
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/posts/create')).toBe(true);
  });

  it('CRITICAL: /dashboard MUST NOT prefix-match ALL dashboard routes', () => {
    // The most dangerous edge case in the entire RBAC system.
    // A custom role with only ["/dashboard"] must NOT gain access
    // to /dashboard/admin/payroll or other privileged routes.
    const onlyDashboard = ['/dashboard'];
    expect(canCustomRoleAccess(onlyDashboard, '/dashboard/admin/payroll')).toBe(false);
    expect(canCustomRoleAccess(onlyDashboard, '/dashboard/security')).toBe(false);
    expect(canCustomRoleAccess(onlyDashboard, '/dashboard/admin/crm')).toBe(false);
    expect(canCustomRoleAccess(onlyDashboard, '/dashboard/users')).toBe(false);
  });

  it('blocks routes completely outside the allowed list', () => {
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/admin/payroll')).toBe(false);
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/security')).toBe(false);
    expect(canCustomRoleAccess(allowedRoutes, '/dashboard/users')).toBe(false);
  });

  it('returns false immediately when allowedRoutes is empty', () => {
    expect(canCustomRoleAccess([], '/dashboard')).toBe(false);
    expect(canCustomRoleAccess([], '/dashboard/posts')).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// canAccessRoute() — Custom roles (non-standard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('canAccessRoute() — custom role strings', () => {
  it('denies access when allowedRoutes is empty', () => {
    expect(canAccessRoute('/dashboard/admin/crm', 'supervisor_ventas', [])).toBe(false);
  });

  it('allows access to explicitly listed routes', () => {
    const allowed = ['/dashboard/admin/crm', '/dashboard/inbox'];
    expect(canAccessRoute('/dashboard/admin/crm', 'supervisor_ventas', allowed)).toBe(true);
    expect(canAccessRoute('/dashboard/inbox', 'supervisor_ventas', allowed)).toBe(true);
  });

  it('blocks access to routes not in the list', () => {
    const allowed = ['/dashboard/admin/crm'];
    expect(canAccessRoute('/dashboard/admin/payroll', 'supervisor_ventas', allowed)).toBe(false);
    expect(canAccessRoute('/dashboard/security', 'supervisor_ventas', allowed)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// getAccessibleRoutes()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('getAccessibleRoutes()', () => {
  it('returns ALL routes for SUPER_ADMIN', () => {
    const routes = getAccessibleRoutes(UserRole.SUPER_ADMIN);
    expect(routes).toEqual(expect.arrayContaining(Object.keys(ROUTE_PERMISSIONS)));
    expect(routes.length).toBe(Object.keys(ROUTE_PERMISSIONS).length);
  });

  it('ADMIN has more routes than CLIENT_USER', () => {
    const adminRoutes = getAccessibleRoutes(UserRole.ADMIN);
    const clientRoutes = getAccessibleRoutes(UserRole.CLIENT_USER);
    expect(adminRoutes.length).toBeGreaterThan(clientRoutes.length);
  });

  it('CLIENT_USER only sees content and project routes', () => {
    const routes = getAccessibleRoutes(UserRole.CLIENT_USER);
    // Should include posts and projects
    expect(routes).toContain('/dashboard/posts');
    expect(routes).toContain('/dashboard/projects');
    // Should NOT include financial or admin routes
    expect(routes).not.toContain('/dashboard/admin/payroll');
    expect(routes).not.toContain('/dashboard/security');
    expect(routes).not.toContain('/dashboard/users');
  });

  it('EXTERNAL_CLIENT only sees the client portal and allowed operations', () => {
    const routes = getAccessibleRoutes(UserRole.EXTERNAL_CLIENT);
    // EXTERNAL_CLIENT has access to: /dashboard/client and /dashboard/admin/operations
    expect(routes).toContain('/dashboard/client');
    expect(routes).toContain('/dashboard/admin/operations');
    // Must NOT have access to sensitive routes
    expect(routes).not.toContain('/dashboard/security');
    expect(routes).not.toContain('/dashboard/users');
    expect(routes).not.toContain('/dashboard/admin/payroll');
    expect(routes).not.toContain('/dashboard/admin/crm');
  });
});

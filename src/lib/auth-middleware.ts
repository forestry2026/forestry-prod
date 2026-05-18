/**
 * Authentication and authorization middleware
 */

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import type { Role } from './permissions';
import { PORTAL_ACCESS, hasPermission } from './permissions';

/**
 * Check if user is authenticated
 * Redirects to login if not
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect('/login');
  }
  return session;
}

/**
 * Check if user has required role
 * Redirects to unauthorized page if not
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role as Role;

  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Check if user has specific permission
 * Redirects to unauthorized if not
 */
export async function requirePermission(permission: string) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role as Role;

  if (!hasPermission(userRole, permission)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Check if user can access a specific portal/path
 */
export async function checkPortalAccess(portal: string) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role as Role;
  const allowedPortals = PORTAL_ACCESS[userRole] || [];

  if (!allowedPortals.includes(portal)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Get current user with role information
 */
export async function getCurrentUser() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return null;
  }

  return {
    id: (session.user as any)?.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any)?.role as Role,
  };
}

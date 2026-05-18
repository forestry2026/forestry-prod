/**
 * Role-based permission system for Forestry B2B Portal
 */

export const ROLES = {
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PRODUCTION: 'PRODUCTION',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS: Record<string, Role[]> = {
  // Quotations
  'quotation:create': [ROLES.ADMIN],
  'quotation:send': [ROLES.ADMIN],
  'quotation:view:own': [ROLES.VENDOR],
  'quotation:view:all': [ROLES.ADMIN, ROLES.MANAGER],
  'quotation:respond': [ROLES.VENDOR],
  'quotation:list': [ROLES.ADMIN, ROLES.VENDOR, ROLES.MANAGER],

  // Production Queue
  'production:queue:view': [ROLES.ADMIN, ROLES.MANAGER],
  'production:approve': [ROLES.MANAGER],
  'production:set-timeline': [ROLES.MANAGER],

  // Production Portal
  'production:jobs:view': [ROLES.PRODUCTION, ROLES.ADMIN, ROLES.MANAGER],
  'production:jobs:list': [ROLES.PRODUCTION],
  'production:status:update': [ROLES.PRODUCTION],
  'production:notes:add': [ROLES.PRODUCTION],

  // Order Tracking
  'order:view:own': [ROLES.VENDOR],
  'order:view:all': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
  'order:list': [ROLES.VENDOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],

  // RFP
  'rfp:create': [ROLES.VENDOR],
  'rfp:view:own': [ROLES.VENDOR],
  'rfp:view:all': [ROLES.ADMIN, ROLES.MANAGER],
  'rfp:list': [ROLES.VENDOR, ROLES.ADMIN],
} as const;

/**
 * Checks if a role has a specific permission.
 * Uses the PERMISSIONS map to determine if the role is in the allowed roles list for the permission.
 *
 * @param role - The role to check (can be a string or Role type)
 * @param permission - The permission key to check (must be a key from PERMISSIONS object)
 * @returns True if the role has the permission, false otherwise
 *
 * @example
 * hasPermission('ADMIN', 'quotation:create')     // Returns: true
 * hasPermission('VENDOR', 'quotation:create')    // Returns: false
 * hasPermission('ADMIN', 'order:list')           // Returns: true
 */
export function hasPermission(role: Role | string, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(role as Role) : false;
}

/**
 * Retrieves all permissions granted to a specific role.
 * Iterates through the PERMISSIONS object and collects all permissions where the role is allowed.
 *
 * @param role - The role for which to retrieve permissions
 * @returns Array of permission keys assigned to the role
 *
 * @example
 * getRolePermissions('ADMIN')
 * // Returns: ['quotation:create', 'quotation:send', 'quotation:view:all', 'production:queue:view', ...]
 *
 * getRolePermissions('VENDOR')
 * // Returns: ['quotation:view:own', 'quotation:respond', 'quotation:list', 'order:view:own', 'order:list', 'rfp:create', 'rfp:view:own', 'rfp:list']
 */
export function getRolePermissions(role: Role): (keyof typeof PERMISSIONS)[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role as Role))
    .map(([permission]) => permission as keyof typeof PERMISSIONS);
}

/**
 * Defines which portals (URL paths) each role can access.
 * ADMIN users have access to both admin and vendor portals, allowing full platform visibility.
 * MANAGER users can access manager and admin features.
 */
export const PORTAL_ACCESS: Record<Role, string[]> = {
  [ROLES.VENDOR]: ['/vendor'],
  [ROLES.ADMIN]: ['/admin', '/vendor'], // Admins can see vendor portal too
  [ROLES.MANAGER]: ['/manager', '/admin'], // Managers can access admin features
  [ROLES.PRODUCTION]: ['/production'],
} as const;

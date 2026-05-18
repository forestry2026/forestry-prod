/**
 * Portal Permissions System
 * Granular per-user section access: none | readonly | editable
 * ADMIN role always gets editable on everything — cannot be restricted.
 */

import {
  LayoutDashboard, Package, Zap, Truck,
  Users, FileText, Settings,
} from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────────── */
export type PermissionLevel = 'none' | 'readonly' | 'editable'

export interface SectionDef {
  id:       string
  label:    string
  icon:     React.ElementType
  path:     string
  adminOnly?: boolean   // true = ADMIN always owns this, other roles start at 'none'
}

export type UserPermissions = Partial<Record<string, PermissionLevel>>

/* ── Section registry ───────────────────────────────────────────── */
export const SECTIONS: SectionDef[] = [
  { id: 'dashboard',  label: 'CMS Dashboard', icon: LayoutDashboard, path: '/admin'            },
  { id: 'products',   label: 'Products',      icon: Package,         path: '/admin/products'   },
  { id: 'attributes', label: 'Attributes',    icon: Zap,             path: '/admin/attributes' },
  { id: 'vendors',    label: 'Vendors',       icon: Truck,           path: '/admin/vendors'    },
  { id: 'rfps',       label: 'RFPs',          icon: FileText,        path: '/admin/rfps'       },
  { id: 'users',      label: 'Users',         icon: Users,           path: '/admin/users',     adminOnly: true },
  { id: 'settings',   label: 'Settings',      icon: Settings,        path: '/admin/settings',  adminOnly: true },
]

/* ── Role defaults ──────────────────────────────────────────────── */
export const ROLE_DEFAULTS: Record<string, Record<string, PermissionLevel>> = {
  ADMIN: {
    dashboard:  'editable',
    products:   'editable',
    attributes: 'editable',
    vendors:    'editable',
    rfps:       'editable',
    users:      'editable',
    settings:   'editable',
  },
  MANAGER: {
    dashboard:  'editable',
    products:   'editable',
    attributes: 'readonly',
    vendors:    'editable',
    rfps:       'editable',
    users:      'none',
    settings:   'none',
  },
  PRODUCTION: {
    dashboard:  'readonly',
    products:   'readonly',
    attributes: 'none',
    vendors:    'none',
    rfps:       'none',
    users:      'none',
    settings:   'none',
  },
}

/* ── Resolution ─────────────────────────────────────────────────── */
/**
 * Resolve effective permission for a section.
 * ADMIN always returns 'editable'. Other roles: user override > role default > 'none'.
 */
export function resolvePermission(
  role:        string,
  userPerms:   UserPermissions,
  sectionId:   string,
): PermissionLevel {
  if (role === 'ADMIN') return 'editable'
  const override = userPerms[sectionId]
  if (override) return override
  return ROLE_DEFAULTS[role]?.[sectionId] ?? 'none'
}

/** Parse raw JSON string from DB into UserPermissions */
export function parsePermissions(raw: string | null | undefined): UserPermissions {
  try { return JSON.parse(raw ?? '{}') ?? {} } catch { return {} }
}

/** Check page access — returns false if 'none' */
export function canAccess(role: string, userPerms: UserPermissions, sectionId: string): boolean {
  return resolvePermission(role, userPerms, sectionId) !== 'none'
}

/** Check if user has full edit rights on a section */
export function canEdit(role: string, userPerms: UserPermissions, sectionId: string): boolean {
  return resolvePermission(role, userPerms, sectionId) === 'editable'
}

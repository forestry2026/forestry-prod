/**
 * Activity log presentation config.
 * Maps raw `action` codes from AuditLog → human-readable label, icon, accent.
 */

export type ActivityCategory =
  | 'auth'
  | 'product'
  | 'vendor'
  | 'rfp'
  | 'attribute'
  | 'system'

export interface ActivityActionConfig {
  label:    string
  category: ActivityCategory
  /** Tailwind text + bg class pair */
  accent:   string
  /** Lucide icon name (string — resolved at render) */
  icon:     string
}

export const ACTION_CONFIG: Record<string, ActivityActionConfig> = {
  // Vendor lifecycle
  VENDOR_APPROVED:           { label: 'Vendor approved',        category: 'vendor', accent: 'text-emerald-700 bg-emerald-50',   icon: 'UserCheck' },
  VENDOR_REJECTED:           { label: 'Vendor rejected',        category: 'vendor', accent: 'text-red-700     bg-red-50',       icon: 'UserX' },
  VENDOR_REAPPROVED:         { label: 'Vendor re-approved',     category: 'vendor', accent: 'text-emerald-700 bg-emerald-50',   icon: 'UserCheck' },
  VENDOR_REVOKED:            { label: 'Vendor access revoked',  category: 'vendor', accent: 'text-red-700     bg-red-50',       icon: 'UserMinus' },
  VENDOR_DELETED:            { label: 'Vendor deleted',         category: 'vendor', accent: 'text-red-700     bg-red-50',       icon: 'Trash2' },
  VENDOR_CREDENTIALS_RESENT: { label: 'Credentials resent',     category: 'vendor', accent: 'text-blue-700    bg-blue-50',      icon: 'Mail' },

  // Product
  PRODUCT_CREATED:    { label: 'Product created',    category: 'product', accent: 'text-terracotta bg-terracotta/10', icon: 'Plus' },
  PRODUCT_UPDATED:    { label: 'Product updated',    category: 'product', accent: 'text-charcoal-700 bg-charcoal-100', icon: 'Pencil' },
  PRODUCT_DELETED:    { label: 'Product deleted',    category: 'product', accent: 'text-red-700 bg-red-50',           icon: 'Trash2' },
  PRODUCT_DUPLICATED: { label: 'Product duplicated', category: 'product', accent: 'text-blue-700 bg-blue-50',         icon: 'Copy' },

  // Attributes
  ATTRIBUTE_CREATED: { label: 'Attribute created', category: 'attribute', accent: 'text-purple-700 bg-purple-50', icon: 'Sparkles' },
  ATTRIBUTE_UPDATED: { label: 'Attribute updated', category: 'attribute', accent: 'text-charcoal-700 bg-charcoal-100', icon: 'Pencil' },
  ATTRIBUTE_DELETED: { label: 'Attribute deleted', category: 'attribute', accent: 'text-red-700 bg-red-50', icon: 'Trash2' },

  // RFP
  RFP_SUBMITTED:           { label: 'RFP submitted',            category: 'rfp', accent: 'text-blue-700    bg-blue-50',        icon: 'FileText'  },
  RFP_CREATED_MANUALLY:    { label: 'RFP created by admin',     category: 'rfp', accent: 'text-terracotta  bg-terracotta/10',   icon: 'Plus'      },
  RFP_WITHDRAWN:           { label: 'RFP withdrawn by vendor', category: 'rfp', accent: 'text-rose-700    bg-rose-50',         icon: 'Trash2'    },
  RFP_VENDOR_DELETED:      { label: 'Removed by vendor',       category: 'rfp', accent: 'text-charcoal-500 bg-charcoal-100',   icon: 'Trash2'    },
  RFP_QUOTED:              { label: 'Quote sent',               category: 'rfp', accent: 'text-sage-600    bg-sage/20',         icon: 'Sparkles'  },
  RFP_ACCEPTED:            { label: 'Quote accepted',           category: 'rfp', accent: 'text-emerald-700 bg-emerald-50',      icon: 'UserCheck' },
  RFP_REVISION_REQUESTED:  { label: 'Revision requested',       category: 'rfp', accent: 'text-yellow-700  bg-yellow-50',       icon: 'Pencil'    },
  RFP_PRODUCTION_STARTED:  { label: 'Production started',       category: 'rfp', accent: 'text-terracotta  bg-terracotta/10',   icon: 'Play'      },
  RFP_COMPLETED:           { label: 'Marked completed',         category: 'rfp', accent: 'text-charcoal-700 bg-charcoal-100',   icon: 'CheckCircle' },
  RFP_ARCHIVED:            { label: 'Archived',                 category: 'rfp', accent: 'text-charcoal-500 bg-charcoal-50',    icon: 'Archive'   },
  RFP_UNARCHIVED:          { label: 'Unarchived',               category: 'rfp', accent: 'text-blue-700    bg-blue-50',        icon: 'ArchiveRestore' },
  RFP_DELETED:             { label: 'Deleted',                  category: 'rfp', accent: 'text-red-700     bg-red-50',          icon: 'Trash2'    },
  RFP_STATUS_CHANGED:      { label: 'Status changed',           category: 'rfp', accent: 'text-charcoal-700 bg-charcoal-100',   icon: 'Pencil'    },

  // Generic CRUD fallback
  CREATE: { label: 'Created', category: 'system', accent: 'text-emerald-700 bg-emerald-50', icon: 'Plus' },
  UPDATE: { label: 'Updated', category: 'system', accent: 'text-charcoal-700 bg-charcoal-100', icon: 'Pencil' },
  DELETE: { label: 'Deleted', category: 'system', accent: 'text-red-700 bg-red-50', icon: 'Trash2' },
}

export function getActionConfig(action: string): ActivityActionConfig {
  return ACTION_CONFIG[action] ?? {
    label:    action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    category: 'system',
    accent:   'text-charcoal-700 bg-charcoal-100',
    icon:     'Circle',
  }
}

export const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  auth:      'Authentication',
  product:   'Products',
  vendor:    'Vendors',
  rfp:       'RFPs',
  attribute: 'Attributes',
  system:    'System',
}

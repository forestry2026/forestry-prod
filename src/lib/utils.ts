import { type ClassValue, clsx } from 'clsx'

/**
 * Merges multiple CSS class names and removes falsy values.
 * Flattens nested arrays and joins the result as a space-separated string.
 *
 * @param inputs - Variable number of class values (strings, arrays, or objects)
 * @returns Merged className string with falsy values removed
 *
 * @example
 * cn('px-2', ['py-1', null], 'hover:bg-gray-100')
 * // Returns: 'px-2 py-1 hover:bg-gray-100'
 */
export function cn(...inputs: ClassValue[]) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
}

/**
 * Formats a number as currency using AED (UAE Dirham) as the default currency.
 * Returns a dash (—) for null or undefined values.
 *
 * @param amount - The numeric amount to format (can be null or undefined)
 * @param currency - The currency code (default: 'AED')
 * @returns Formatted currency string (e.g., 'AED 1,234.50') or '—' if amount is null/undefined
 *
 * @example
 * formatCurrency(1234.5)          // Returns: 'AED 1,234.50'
 * formatCurrency(null)            // Returns: '—'
 * formatCurrency(500, 'USD')      // Returns: 'USD 500.00'
 */
export function formatCurrency(amount: number | null | undefined, currency = 'AED'): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-AE', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a date in UAE locale (en-AE) with the format: DD MMM YYYY (e.g., '09 May 2026').
 * Returns a dash (—) for null or undefined values.
 *
 * @param date - The date to format (can be a string, Date object, or null/undefined)
 * @param opts - Optional Intl.DateTimeFormatOptions to override defaults
 * @returns Formatted date string (e.g., '09 May 2026') or '—' if date is null/undefined
 *
 * @example
 * formatDate(new Date('2026-05-09'))     // Returns: '09 May 2026'
 * formatDate('2026-05-09')               // Returns: '09 May 2026'
 * formatDate(null)                       // Returns: '—'
 * formatDate(new Date(), { weekday: 'long' }) // Custom format with weekday
 */
export function formatDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-AE', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    ...opts,
  }).format(new Date(date))
}

/**
 * Generates the next sequential RFP (Request For Proposal) number.
 * Format: RFP-{YYYY}-{NNNN} (e.g., 'RFP-2026-0001', 'RFP-2026-0042')
 * Queries the database to find the highest existing number for the current year and increments it.
 *
 * @param prisma - Prisma client instance for database queries
 * @returns Promise resolving to the next RFP number as a string
 * @throws Will throw if database query fails
 *
 * @example
 * const rfpNum = await generateRfpNumber(prisma)
 * // Returns: 'RFP-2026-0001' (if first RFP of the year)
 */
export async function generateRfpNumber(prisma: any): Promise<string> {
  const year   = new Date().getFullYear()
  const prefix = `RFP-${year}-`
  const last   = await prisma.rfp.findFirst({
    where:   { rfpNumber: { startsWith: prefix } },
    orderBy: { rfpNumber: 'desc' },
    select:  { rfpNumber: true },
  })
  const seq = last
    ? parseInt(last.rfpNumber.replace(prefix, '') || '0', 10) + 1
    : 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

/**
 * Generates a random password with mixed character types.
 * Character set includes lowercase, uppercase, digits, and special characters: !@#$%
 *
 * @param length - Password length in characters (default: 12)
 * @returns Random password string of specified length
 *
 * @example
 * generatePassword()           // Returns: 'aB3$xYz9!@pQ' (length 12)
 * generatePassword(20)         // Returns: 20-character random password
 */
export function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/**
 * Truncates a string to a maximum length and appends an ellipsis (…) if truncated.
 *
 * @param str - The string to truncate
 * @param max - Maximum number of characters (not including the ellipsis)
 * @returns Truncated string with ellipsis, or original string if it fits
 *
 * @example
 * truncate('Hello World', 5)     // Returns: 'Hello…'
 * truncate('Hi', 5)              // Returns: 'Hi'
 */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

/**
 * Converts a string to a URL-friendly slug.
 * Converts to lowercase, replaces spaces with hyphens, and removes non-alphanumeric characters (except hyphens).
 *
 * @param str - The string to convert to slug format
 * @returns Lowercase slug with hyphens and no special characters
 *
 * @example
 * slugify('Hello World!')       // Returns: 'hello-world'
 * slugify('Product Name 2026')  // Returns: 'product-name-2026'
 * slugify('  Multiple  Spaces ') // Returns: 'multiple-spaces'
 */
export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

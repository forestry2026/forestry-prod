import { prisma } from '@/lib/prisma'

/**
 * Options for the writeAuditLog function.
 */
interface LogOptions {
  userId?:     string | null
  action:      string
  entityType:  string
  entityId:    string
  details?:    Record<string, unknown>
  ipAddress?:  string | null
}

/**
 * Writes an audit log entry to the database.
 * Non-fatal operation failures are silently caught to ensure they do not interrupt request flow.
 * Useful for tracking user actions, system events, and changes to entities for compliance and debugging.
 *
 * @param opts - Audit log options: userId, action, entityType, entityId, optional details and ipAddress
 * @returns Promise that resolves when the log is written (or silently fails)
 *
 * @example
 * await writeAuditLog({
 *   userId: 'user-123',
 *   action: 'CREATE',
 *   entityType: 'QUOTATION',
 *   entityId: 'quote-456',
 *   details: { rfpNumber: 'RFP-2026-0001', total: 5000 },
 *   ipAddress: '192.168.1.1'
 * })
 */
export async function writeAuditLog(opts: LogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     opts.userId     ?? null,
        action:     opts.action,
        entityType: opts.entityType,
        entityId:   opts.entityId,
        details:    opts.details ? JSON.stringify(opts.details) : null,
        ipAddress:  opts.ipAddress  ?? null,
      },
    })
  } catch {
    // Non-fatal — never let audit log failure break the request
  }
}

/**
 * Extracts the client IP address from a request.
 * First attempts to read from the x-forwarded-for header (for proxied requests).
 * Falls back to null if the header is missing or parsing fails.
 *
 * @param req - A Next.js Request or NextRequest object
 * @returns The client IP address as a string, or null if unable to determine
 *
 * @example
 * const ip = getIp(request)
 * // Returns: '192.168.1.1' or null
 */
export function getIp(req: Request | import('next/server').NextRequest): string | null {
  try {
    const fwd = (req.headers as Headers).get('x-forwarded-for')
    return fwd ? fwd.split(',')[0].trim() : null
  } catch {
    return null
  }
}

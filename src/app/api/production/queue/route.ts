/**
 * GET /api/production/queue - Get orders pending manager approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hasPermission } from '@/lib/permissions';
import { getProductionQueue } from '@/lib/services/production.service';
import type { Priority } from '@/lib/services/production.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;

    // Check permission
    if (!hasPermission(userRole, 'production:queue:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const priority = url.searchParams.get('priority') as Priority | null;
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const queue = await getProductionQueue({
      priority: priority || undefined,
      limit,
      offset,
    });

    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error fetching production queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotations - Create new quotation from RFP
 * GET /api/quotations - List quotations (with filters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { createQuotation, listQuotations } from '@/lib/services/quotation.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    // Check permission
    if (!hasPermission(userRole, 'quotation:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { rfpId, items, subtotal, tax, total, validUntil, terms, notes } = body;

    // Validate required fields
    if (!rfpId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: rfpId, items' },
        { status: 400 }
      );
    }

    // Verify RFP exists and user has access
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
      include: { vendorProfile: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Create quotation
    const quotation = await createQuotation(rfpId, items, {
      subtotal,
      tax,
      total,
      validUntil: new Date(validUntil),
      terms,
      notes,
      createdBy: userId,
    });

    // Update RFP status to QUOTED
    await prisma.rfp.update({
      where: { id: rfpId },
      data: { status: 'QUOTED' },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    // Check permission
    if (!hasPermission(userRole, 'quotation:list')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Vendors only see their own quotations
    const createdBy = userRole === 'VENDOR' ? userId : undefined;

    const quotations = await listQuotations({
      status: status || undefined,
      createdBy,
      limit,
      offset,
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error listing quotations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

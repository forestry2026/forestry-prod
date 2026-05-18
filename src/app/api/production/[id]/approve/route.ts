/**
 * POST /api/production/[id]/approve - Manager approves order and sets timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hasPermission } from '@/lib/permissions';
import { approveProductionOrder } from '@/lib/services/production.service';
import { sendProductionApprovedEmail } from '@/lib/emails';
import type { Priority } from '@/lib/services/production.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    // Check permission
    if (!hasPermission(userRole, 'production:approve')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params
    const orderId = id;
    const body = await request.json();
    const { estimatedDays, priority, notes } = body;

    // Validate required fields
    if (!estimatedDays || typeof estimatedDays !== 'number' || estimatedDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid estimatedDays. Must be a positive number' },
        { status: 400 }
      );
    }

    // Approve order
    const approvedOrder = await approveProductionOrder(orderId, {
      managerId: userId,
      estimatedDays,
      priority: (priority || 'NORMAL') as Priority,
      notes,
    });

    // Send email to vendor
    try {
      const vendorEmail = (approvedOrder.quotation.rfp.vendorProfile as any).user?.email;
      const companyName = approvedOrder.quotation.rfp.vendorProfile.companyName;

      await sendProductionApprovedEmail(
        vendorEmail,
        companyName,
        approvedOrder.orderNumber,
        approvedOrder.estimatedCompletion || new Date()
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(approvedOrder);
  } catch (error) {
    console.error('Error approving production order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

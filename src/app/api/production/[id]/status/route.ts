/**
 * PATCH /api/production/[id]/status - Update production stage
 * Production team moves job through stages: MOLDING → DRYING → FINISHING → etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hasPermission } from '@/lib/permissions';
import { updateProductionStage, canTransitionToStage } from '@/lib/services/production.service';
import { sendProductionUpdateEmail } from '@/lib/emails';
import type { ProductionStage } from '@/lib/services/production.service';

export async function PATCH(
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
    if (!hasPermission(userRole, 'production:status:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params
    const orderId = id;
    const body = await request.json();
    const { toStage, notes } = body;

    const validStages = ['PENDING', 'MOLDING', 'DRYING', 'FINISHING', 'GLAZING', 'QUALITY_CHECK', 'PACKAGING', 'READY'];

    if (!toStage || !validStages.includes(toStage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current order to validate transition
    const { prisma } = await import('@/lib/prisma');
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        quotation: {
          include: {
            rfp: {
              include: {
                vendorProfile: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate stage transition
    if (!canTransitionToStage(order.currentStage as ProductionStage, toStage as ProductionStage)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${order.currentStage} to ${toStage}. Can only move to next stage or back one step.`,
        },
        { status: 400 }
      );
    }

    // Update status
    const updatedOrder = await updateProductionStage(orderId, toStage as ProductionStage, {
      updatedBy: userId,
      updatedByRole: userRole as 'ADMIN' | 'MANAGER' | 'PRODUCTION',
      notes,
    });

    // Send email to vendor (if moving to a major stage or completed)
    try {
      const majorStages = ['MOLDING', 'QUALITY_CHECK', 'READY'];
      if (majorStages.includes(toStage)) {
        const vendorEmail = order.quotation.rfp.vendorProfile.user.email;
        const companyName = order.quotation.rfp.vendorProfile.companyName;

        await sendProductionUpdateEmail(vendorEmail, companyName, order.orderNumber, toStage, notes);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating production status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

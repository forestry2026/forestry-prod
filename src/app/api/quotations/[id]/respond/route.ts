/**
 * POST /api/quotations/[id]/respond - Vendor responds to quotation
 * Actions: APPROVE, DECLINE, REQUEST_REVISION
 * If approved, creates production order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { respondToQuotation } from '@/lib/services/quotation.service';
import {
  sendQuotationApprovedEmail,
  sendQuotationDeclinedEmail,
  sendQuotationRevisionEmail,
  sendProductionStartedEmail,
} from '@/lib/emails';

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

    // Check permission
    if (!hasPermission(userRole, 'quotation:respond')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params
    const quotationId = id;
    const body = await request.json();
    const { action, notes } = body;

    if (!['APPROVE', 'DECLINE', 'REQUEST_REVISION'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE, DECLINE, or REQUEST_REVISION' },
        { status: 400 }
      );
    }

    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
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
        items: true,
        createdByUser: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Can only respond to SENT quotations
    if (quotation.status !== 'SENT') {
      return NextResponse.json(
        { error: 'Can only respond to SENT quotations' },
        { status: 400 }
      );
    }

    // Process response
    const result = await respondToQuotation(quotationId, action, notes);

    // Send appropriate emails
    const vendorEmail = quotation.rfp.vendorProfile.user.email;
    const adminEmail = quotation.createdByUser.email;
    const companyName = quotation.rfp.vendorProfile.companyName;

    try {
      if (action === 'APPROVE') {
        // Send confirmation to vendor
        await sendQuotationApprovedEmail(
          vendorEmail,
          companyName,
          (quotation as any).orderNumber || `${quotation.id.substring(0, 8)}`,
          quotation.total
        );

        // Send production started email
        if (result.productionOrder) {
          await sendProductionStartedEmail(
            vendorEmail,
            companyName,
            result.productionOrder.orderNumber,
            result.productionOrder.estimatedCompletion || new Date()
          );
        }

        // Notify admin
        await sendQuotationApprovedEmail(adminEmail, companyName, quotation.id, quotation.total);
      } else if (action === 'DECLINE') {
        // Notify admin of decline
        await sendQuotationDeclinedEmail(adminEmail, companyName, quotation.id, notes);
      } else if (action === 'REQUEST_REVISION') {
        // Notify admin of revision request
        await sendQuotationRevisionEmail(adminEmail, companyName, quotation.id, notes);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error responding to quotation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotations/[id]/send - Send quotation to vendor
 * Triggers email notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { sendQuotation } from '@/lib/services/quotation.service';
import { sendQuotationEmail } from '@/lib/emails';

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
    if (!hasPermission(userRole, 'quotation:send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params
    const quotationId = id;

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
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Can't send if already sent
    if (quotation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Quotation can only be sent from DRAFT status' },
        { status: 400 }
      );
    }

    // Send quotation and update status
    const updatedQuotation = await sendQuotation(quotationId);

    // Send email to vendor
    try {
      await sendQuotationEmail(
        quotation.rfp.vendorProfile.user.email,
        quotation.rfp.vendorProfile.companyName,
        quotation,
        `${process.env.NEXT_PUBLIC_APP_URL}/vendor/quotations/${quotationId}`
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error('Error sending quotation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

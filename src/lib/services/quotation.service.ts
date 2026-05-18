/**
 * Quotation business logic and utilities
 */

import { prisma } from '@/lib/prisma';
import { Quotation, ProductionOrder } from '@prisma/client';

/**
 * Create a quotation from an RFP
 */
export async function createQuotation(
  rfpId: string,
  items: Array<{
    rfpItemId: string;
    description: string;
    specifications: string; // JSON string
    quantity: number;
    unitPrice: number;
  }>,
  data: {
    subtotal: number;
    tax?: number;
    total: number;
    validUntil: Date;
    terms?: string;
    notes?: string;
    createdBy: string;
  }
) {
  const quotationItems = items.map((item) => ({
    rfpItemId: item.rfpItemId,
    description: item.description,
    specifications: item.specifications,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.unitPrice * item.quantity,
  }));

  return await prisma.quotation.create({
    data: {
      rfpId,
      items: {
        createMany: {
          data: quotationItems,
        },
      },
      ...data,
    },
    include: {
      items: true,
      rfp: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });
}

/**
 * Send quotation to vendor (updates status and sends email)
 */
export async function sendQuotation(quotationId: string) {
  return await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
    include: {
      rfp: {
        include: {
          vendorProfile: true,
        },
      },
      items: true,
    },
  });
}

/**
 * Handle vendor response to quotation (approve/decline/request revision)
 * If approved, creates production order
 */
export async function respondToQuotation(
  quotationId: string,
  response: 'APPROVE' | 'DECLINE' | 'REQUEST_REVISION',
  notes?: string
) {
  const quotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status:
        response === 'APPROVE'
          ? 'APPROVED'
          : response === 'DECLINE'
            ? 'DECLINED'
            : 'REVISION_REQUESTED',
      vendorResponse: response,
      vendorNotes: notes,
      respondedAt: new Date(),
    },
    include: {
      rfp: {
        include: {
          vendorProfile: true,
        },
      },
      items: true,
    },
  });

  // If approved, create production order
  if (response === 'APPROVE') {
    const productionOrder = await createProductionOrder(quotation);
    return { quotation, productionOrder };
  }

  return { quotation };
}

/**
 * Create production order from approved quotation
 */
async function createProductionOrder(quotation: any) {
  const orderNumber = await generateOrderNumber();

  return await prisma.productionOrder.create({
    data: {
      quotationId: quotation.id,
      orderNumber,
      status: 'QUEUED',
      priority: 'NORMAL',
      currentStage: 'PENDING',
    },
    include: {
      quotation: {
        include: {
          rfp: {
            include: {
              vendorProfile: true,
            },
          },
          items: true,
        },
      },
      statusHistory: true,
    },
  });
}

/**
 * Generate unique order number (e.g., PO-2026-0001)
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.productionOrder.findFirst({
    where: {
      orderNumber: {
        startsWith: `PO-${year}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `PO-${year}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Get quotation details with related data
 */
export async function getQuotationDetails(quotationId: string) {
  return await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      rfp: {
        include: {
          vendorProfile: {
            include: {
              user: true,
            },
          },
          items: {
            include: {
              product: true,
              dimension: true,
              color: true,
              texture: true,
              finish: true,
            },
          },
        },
      },
      items: true,
      createdByUser: true,
      productionOrder: {
        include: {
          statusHistory: true,
        },
      },
    },
  });
}

/**
 * List quotations with filtering
 */
export async function listQuotations(
  filters: {
    status?: string;
    vendorId?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, vendorId, createdBy, limit = 20, offset = 0 } = filters;

  const where: any = {};
  if (status) where.status = status;
  if (createdBy) where.createdBy = createdBy;
  if (vendorId) {
    where.rfp = {
      vendorProfile: {
        id: vendorId,
      },
    };
  }

  return await prisma.quotation.findMany({
    where,
    include: {
      rfp: {
        include: {
          vendorProfile: true,
        },
      },
      items: true,
      createdByUser: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
}

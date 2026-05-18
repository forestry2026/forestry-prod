/**
 * Production order business logic and utilities
 */

import { prisma } from '@/lib/prisma';
import type { ProductionOrder, ProductionStatusLog } from '@prisma/client';

export type ProductionStage =
  | 'PENDING'
  | 'MOLDING'
  | 'DRYING'
  | 'FINISHING'
  | 'GLAZING'
  | 'QUALITY_CHECK'
  | 'PACKAGING'
  | 'READY';

export type ProductionStatus = 'QUEUED' | 'APPROVED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Get production queue (pending manager approval)
 */
export async function getProductionQueue(
  filters: {
    priority?: Priority;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { priority, limit = 20, offset = 0 } = filters;

  const where: any = {
    status: 'QUEUED',
  };
  if (priority) where.priority = priority;

  return await prisma.productionOrder.findMany({
    where,
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
      managerApprovedUser: true,
      statusHistory: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Manager approves production order and sets timeline
 */
export async function approveProductionOrder(
  orderId: string,
  data: {
    managerId: string;
    estimatedDays: number;
    priority?: Priority;
    notes?: string;
  }
) {
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + data.estimatedDays);

  return await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      status: 'APPROVED',
      priority: data.priority || 'NORMAL',
      estimatedDays: data.estimatedDays,
      estimatedCompletion,
      managerApprovedBy: data.managerId,
      managerApprovedAt: new Date(),
      managerNotes: data.notes,
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
      managerApprovedUser: true,
      statusHistory: true,
    },
  });
}

/**
 * Get active production jobs
 */
export async function getActiveJobs(
  filters: {
    stage?: ProductionStage;
    priority?: Priority;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { stage, priority, limit = 20, offset = 0 } = filters;

  const where: any = {
    status: { in: ['APPROVED', 'IN_PROGRESS'] },
  };
  if (stage) where.currentStage = stage;
  if (priority) where.priority = priority;

  return await prisma.productionOrder.findMany({
    where,
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
    orderBy: [{ priority: 'asc' }, { estimatedCompletion: 'asc' }],
    take: limit,
    skip: offset,
  });
}

/**
 * Get job details
 */
export async function getJobDetails(orderId: string) {
  return await prisma.productionOrder.findUnique({
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
          items: {
            include: {
              quotation: true,
            },
          },
        },
      },
      managerApprovedUser: true,
      statusHistory: {
        include: {
          updatedByUser: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

/**
 * Update production stage and create status log
 */
export async function updateProductionStage(
  orderId: string,
  toStage: ProductionStage,
  data: {
    updatedBy: string;
    updatedByRole: 'ADMIN' | 'MANAGER' | 'PRODUCTION';
    notes?: string;
  }
) {
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const fromStage = order.currentStage as ProductionStage;

  // Update order status and stage
  const updatedOrder = await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      currentStage: toStage,
      status: toStage === 'READY' ? 'COMPLETED' : 'IN_PROGRESS',
      ...(toStage === 'READY' && { actualCompletion: new Date() }),
    },
  });

  // Create status log
  await prisma.productionStatusLog.create({
    data: {
      productionOrderId: orderId,
      fromStage,
      toStage,
      notes: data.notes,
      updatedBy: data.updatedBy,
      updatedByRole: data.updatedByRole,
    },
  });

  return updatedOrder;
}

/**
 * Add production notes
 */
export async function addProductionNotes(orderId: string, notes: string) {
  return await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      productionNotes: notes,
    },
  });
}

/**
 * Get completed jobs
 */
export async function getCompletedJobs(
  filters: {
    limit?: number;
    offset?: number;
  } = {}
) {
  const { limit = 20, offset = 0 } = filters;

  return await prisma.productionOrder.findMany({
    where: {
      status: 'COMPLETED',
    },
    include: {
      quotation: {
        include: {
          rfp: {
            include: {
              vendorProfile: true,
            },
          },
        },
      },
      statusHistory: true,
    },
    orderBy: {
      actualCompletion: 'desc',
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Get production KPIs for dashboard
 */
export async function getProductionKPIs() {
  const [activeCount, completedToday, overdue, totalCompleted] = await Promise.all([
    prisma.productionOrder.count({
      where: {
        status: { in: ['APPROVED', 'IN_PROGRESS'] },
      },
    }),
    prisma.productionOrder.count({
      where: {
        status: 'COMPLETED',
        actualCompletion: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.productionOrder.count({
      where: {
        status: { in: ['APPROVED', 'IN_PROGRESS'] },
        estimatedCompletion: {
          lt: new Date(),
        },
      },
    }),
    prisma.productionOrder.count({
      where: {
        status: 'COMPLETED',
      },
    }),
  ]);

  return {
    activeJobs: activeCount,
    completedToday,
    overdueJobs: overdue,
    totalCompleted,
  };
}

/**
 * Validate stage transition (can't skip stages)
 */
export function canTransitionToStage(currentStage: ProductionStage, targetStage: ProductionStage): boolean {
  const stages: ProductionStage[] = ['PENDING', 'MOLDING', 'DRYING', 'FINISHING', 'GLAZING', 'QUALITY_CHECK', 'PACKAGING', 'READY'];

  const currentIndex = stages.indexOf(currentStage);
  const targetIndex = stages.indexOf(targetStage);

  // Can only transition to next stage or back one step
  return targetIndex === currentIndex + 1 || targetIndex === currentIndex - 1;
}

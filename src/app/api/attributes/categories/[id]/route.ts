import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

async function getAuthenticatedUser() {
  // Must pass `authOptions` — otherwise session role/email mapping
  // configured in NextAuth callbacks is not applied and the call
  // returns null in the App Router, producing a spurious 403.
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return null;
  }

  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Manager role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: validatedData.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id: id },
      data: validatedData,
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'CATEGORY',
        entityId: category.id,
        details: JSON.stringify(validatedData),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Manager role required' },
        { status: 403 }
      );
    }

    // Check if category exists + how many products use it
    const existingCategory = await prisma.category.findUnique({
      where:    { id },
      include:  { products: { select: { productId: true } } },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const productCount = existingCategory.products.length;
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${productCount} product${productCount === 1 ? ' is' : 's are'} still assigned to this category. Reassign or delete them first.` },
        { status: 409 }
      );
    }

    // Delete the category
    const category = await prisma.category.delete({
      where: { id },
    });

    // Log action — wrap separately so a logging failure doesn't surface as
    // a 500 to the admin (the category has already been deleted at this point).
    try {
      await prisma.auditLog.create({
        data: {
          userId:     user.id,
          action:     'DELETE',
          entityType: 'CATEGORY',
          entityId:   category.id,
          details:    JSON.stringify({ name: category.name }),
        },
      });
    } catch (logErr) {
      console.error('Category deleted but audit log failed:', logErr);
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    // Surface Prisma error codes for cleaner UX
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete — this category is still referenced by another record.' },
        { status: 409 }
      );
    }
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? 'Failed to delete category' },
      { status: 500 }
    );
  }
}

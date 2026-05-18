import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

async function getAuthenticatedUser() {
  const session = await getServerSession();

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

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Delete the category
    const category = await prisma.category.delete({
      where: { id: id },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'CATEGORY',
        entityId: category.id,
        details: JSON.stringify({ name: category.name }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

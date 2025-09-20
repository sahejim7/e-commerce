import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder.length) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order items first (due to foreign key constraint)
    await db
      .delete(orderItems)
      .where(eq(orderItems.orderId, id));

    // Delete the order
    await db
      .delete(orders)
      .where(eq(orders.id, id));

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

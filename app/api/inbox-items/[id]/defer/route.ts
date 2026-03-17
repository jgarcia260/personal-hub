import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems } from "@/db/schema";
import { eq, and, max } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/inbox-items/[id]/defer - Move item to back of queue without triaging
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    // Get the item being deferred
    const [item] = await db.select().from(inboxItems).where(eq(inboxItems.id, id));
    
    if (!item) {
      return NextResponse.json(
        { error: "Inbox item not found" },
        { status: 404 }
      );
    }
    
    if (item.triaged) {
      return NextResponse.json(
        { error: "Cannot defer triaged item" },
        { status: 400 }
      );
    }
    
    // Get the max position for this user's untriaged items
    const [maxPositionResult] = await db
      .select({ maxPos: max(inboxItems.position) })
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.targetUser, item.targetUser),
          eq(inboxItems.triaged, false)
        )
      );
    
    const newPosition = (maxPositionResult?.maxPos ?? 0) + 1;
    
    // Update the item's position to the end of the queue
    await db
      .update(inboxItems)
      .set({
        position: newPosition,
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, id));
    
    return NextResponse.json({
      message: "Item deferred successfully",
      itemId: id,
      newPosition,
    });
  } catch (error) {
    console.error("Error deferring inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/inbox-items/[id]/triage - Mark item as triaged and reorder queue
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    // Get the item being triaged
    const [item] = await db.select().from(inboxItems).where(eq(inboxItems.id, id));
    
    if (!item) {
      return NextResponse.json(
        { error: "Inbox item not found" },
        { status: 404 }
      );
    }
    
    if (item.triaged) {
      return NextResponse.json(
        { message: "Item already triaged" },
        { status: 200 }
      );
    }
    
    // Mark as triaged and decrement positions of items after it
    await db.transaction(async (tx) => {
      // Mark the item as triaged
      await tx
        .update(inboxItems)
        .set({
          triaged: true,
          updatedAt: new Date(),
        })
        .where(eq(inboxItems.id, id));
      
      // Decrement position of all items that were after this one
      // This fills the gap left by the triaged item
      await tx
        .update(inboxItems)
        .set({
          position: sql`${inboxItems.position} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inboxItems.targetUser, item.targetUser),
            gt(inboxItems.position, item.position),
            eq(inboxItems.triaged, false)
          )
        );
    });
    
    return NextResponse.json({
      message: "Item triaged successfully",
      itemId: id,
    });
  } catch (error) {
    console.error("Error triaging inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

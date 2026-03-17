import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// POST /api/inbox-items/reorder - Reorder inbox items
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { targetUser, itemPositions } = body;
    
    if (!targetUser || !itemPositions || !Array.isArray(itemPositions)) {
      return NextResponse.json(
        { error: "Missing required fields: targetUser, itemPositions (array)" },
        { status: 400 }
      );
    }
    
    // Update positions in a transaction
    await db.transaction(async (tx) => {
      for (const { id, position } of itemPositions) {
        await tx
          .update(inboxItems)
          .set({
            position,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inboxItems.id, id),
              eq(inboxItems.targetUser, targetUser)
            )
          );
      }
    });
    
    return NextResponse.json({
      message: "Inbox items reordered successfully",
      updated: itemPositions.length,
    });
  } catch (error) {
    console.error("Error reordering inbox items:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

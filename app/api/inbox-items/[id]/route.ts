import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/inbox-items/[id] - Get single inbox item
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    const [inboxItem] = await db.select().from(inboxItems).where(eq(inboxItems.id, id));
    
    if (!inboxItem) {
      return NextResponse.json(
        { error: "Inbox item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(inboxItem);
  } catch (error) {
    console.error("Error fetching inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/inbox-items/[id] - Update inbox item
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    const body = await request.json();
    
    const [updatedInboxItem] = await db
      .update(inboxItems)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, id))
      .returning();
    
    if (!updatedInboxItem) {
      return NextResponse.json(
        { error: "Inbox item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedInboxItem);
  } catch (error) {
    console.error("Error updating inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

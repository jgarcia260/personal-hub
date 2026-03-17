import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/inbox-items - List inbox items (optionally filtered)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const targetUser = searchParams.get("targetUser");
    const triaged = searchParams.get("triaged");
    
    // Build query conditions
    const conditions = [];
    if (targetUser) conditions.push(eq(inboxItems.targetUser, targetUser));
    if (triaged !== null) conditions.push(eq(inboxItems.triaged, triaged === "true"));
    
    const result = conditions.length > 0
      ? await db.select().from(inboxItems).where(and(...conditions))
      : await db.select().from(inboxItems);
    
    return NextResponse.json({ inboxItems: result });
  } catch (error) {
    console.error("Error fetching inbox items:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/inbox-items - Create new inbox item
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { ticketId, targetUser, position } = body;
    
    if (!ticketId || !targetUser || position === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, targetUser, position" },
        { status: 400 }
      );
    }
    
    const [newInboxItem] = await db.insert(inboxItems).values({
      ticketId,
      targetUser,
      position,
      triaged: false,
    }).returning();
    
    return NextResponse.json(newInboxItem, { status: 201 });
  } catch (error) {
    console.error("Error creating inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

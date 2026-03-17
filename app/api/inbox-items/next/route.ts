import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { inboxItems, tickets } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET /api/inbox-items/next - Get next inbox item for a user
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const targetUser = searchParams.get("targetUser");
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "Missing required parameter: targetUser" },
        { status: 400 }
      );
    }
    
    // Get the next untriaged item with lowest position
    const [nextItem] = await db
      .select({
        id: inboxItems.id,
        ticketId: inboxItems.ticketId,
        targetUser: inboxItems.targetUser,
        position: inboxItems.position,
        triaged: inboxItems.triaged,
        createdAt: inboxItems.createdAt,
        updatedAt: inboxItems.updatedAt,
        ticket: tickets,
      })
      .from(inboxItems)
      .leftJoin(tickets, eq(inboxItems.ticketId, tickets.id))
      .where(
        and(
          eq(inboxItems.targetUser, targetUser),
          eq(inboxItems.triaged, false)
        )
      )
      .orderBy(asc(inboxItems.position))
      .limit(1);
    
    if (!nextItem) {
      return NextResponse.json(
        { message: "No untriaged items in queue" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(nextItem);
  } catch (error) {
    console.error("Error fetching next inbox item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

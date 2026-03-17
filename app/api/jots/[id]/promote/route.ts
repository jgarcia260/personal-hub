import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { jots, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/jots/:id/promote - Promote a jot to a full ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    
    // Get the jot
    const [jot] = await db.select().from(jots).where(eq(jots.id, id));
    
    if (!jot) {
      return NextResponse.json(
        { error: "Jot not found" },
        { status: 404 }
      );
    }
    
    // Check if already promoted
    if (jot.promotedTo) {
      return NextResponse.json(
        { error: "Jot already promoted to a ticket", ticketId: jot.promotedTo },
        { status: 400 }
      );
    }
    
    // Get optional ticket details from request body
    const body = await request.json().catch(() => ({}));
    const { title, description, type = "task" } = body;
    
    // Create the ticket using jot content
    const [newTicket] = await db.insert(tickets).values({
      title: title || jot.content.substring(0, 100), // Use first 100 chars as title if not provided
      description: description || jot.content, // Use full content as description
      type: type as "task" | "research",
      status: "inbox",
      assigneeId: jot.authorId, // Assign to the original author
    }).returning();
    
    // Update the jot to mark it as promoted
    await db.update(jots)
      .set({ promotedTo: newTicket.id, updatedAt: new Date() })
      .where(eq(jots.id, id));
    
    return NextResponse.json({
      message: "Jot promoted to ticket",
      ticket: newTicket,
      jot: { ...jot, promotedTo: newTicket.id }
    }, { status: 201 });
  } catch (error) {
    console.error("Error promoting jot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

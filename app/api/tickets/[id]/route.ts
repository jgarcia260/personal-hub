import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/tickets/[id] - Get single ticket
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Update ticket
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    const body = await request.json();
    
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    const [deletedTicket] = await db
      .delete(tickets)
      .where(eq(tickets.id, id))
      .returning();
    
    if (!deletedTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, deletedTicket });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

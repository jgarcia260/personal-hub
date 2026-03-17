import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// GET /api/tickets - List tickets with optional filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");
    
    // Build query conditions
    const conditions = [];
    if (status) conditions.push(eq(tickets.status, status));
    if (assigneeId) conditions.push(eq(tickets.assigneeId, assigneeId));
    if (projectId) conditions.push(eq(tickets.projectId, projectId));
    if (type) conditions.push(eq(tickets.type, type));
    
    const result = conditions.length > 0
      ? await db.select().from(tickets).where(and(...conditions))
      : await db.select().from(tickets);
    
    return NextResponse.json({ tickets: result });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { title, description, type, status, priority, projectId, assigneeId } = body;
    
    if (!title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, type" },
        { status: 400 }
      );
    }
    
    const [newTicket] = await db.insert(tickets).values({
      title,
      description,
      type,
      status: status || "inbox",
      priority,
      projectId,
      assigneeId,
    }).returning();
    
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

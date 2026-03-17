import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Type guards for enums
type TicketStatus = "inbox" | "next" | "active" | "done" | "archived";
type TicketType = "task" | "research";

function isValidStatus(status: string | null): status is TicketStatus {
  return status !== null && ["inbox", "next", "active", "done", "archived"].includes(status);
}

function isValidType(type: string | null): type is TicketType {
  return type !== null && ["task", "research"].includes(type);
}

// GET /api/tickets - List tickets with optional filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const statusParam = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const projectId = searchParams.get("projectId");
    const typeParam = searchParams.get("type");
    
    // Build query conditions with proper type checking
    const conditions = [];
    if (isValidStatus(statusParam)) conditions.push(eq(tickets.status, statusParam));
    if (assigneeId) conditions.push(eq(tickets.assigneeId, assigneeId));
    if (projectId) conditions.push(eq(tickets.projectId, projectId));
    if (isValidType(typeParam)) conditions.push(eq(tickets.type, typeParam));
    
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
    
    // Validate enum values
    if (!isValidType(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'task' or 'research'" },
        { status: 400 }
      );
    }
    
    if (status && !isValidStatus(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'inbox', 'next', 'active', 'done', or 'archived'" },
        { status: 400 }
      );
    }
    
    const [newTicket] = await db.insert(tickets).values({
      title,
      description,
      type,
      status: (status && isValidStatus(status)) ? status : "inbox",
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

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/comments - List comments (optionally filtered by ticketId)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const ticketId = searchParams.get("ticketId");
    
    const result = ticketId
      ? await db.select().from(comments).where(eq(comments.ticketId, ticketId))
      : await db.select().from(comments);
    
    return NextResponse.json({ comments: result });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { ticketId, authorId, content } = body;
    
    if (!ticketId || !authorId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, authorId, content" },
        { status: 400 }
      );
    }
    
    const [newComment] = await db.insert(comments).values({
      ticketId,
      authorId,
      content,
    }).returning();
    
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

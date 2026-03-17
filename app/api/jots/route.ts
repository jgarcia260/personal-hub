import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { jots } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/jots - List jots (optionally filtered by authorId)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const authorId = searchParams.get("authorId");
    
    const result = authorId
      ? await db.select().from(jots).where(eq(jots.authorId, authorId))
      : await db.select().from(jots);
    
    return NextResponse.json({ jots: result });
  } catch (error) {
    console.error("Error fetching jots:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/jots - Create new jot
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { content, authorId, promotedTo } = body;
    
    if (!content || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields: content, authorId" },
        { status: 400 }
      );
    }
    
    const [newJot] = await db.insert(jots).values({
      content,
      authorId,
      promotedTo,
    }).returning();
    
    return NextResponse.json(newJot, { status: 201 });
  } catch (error) {
    console.error("Error creating jot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

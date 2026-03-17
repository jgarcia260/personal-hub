import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const ownerId = searchParams.get("ownerId");
    
    const result = ownerId
      ? await db.select().from(projects).where(eq(projects.ownerId, ownerId))
      : await db.select().from(projects);
    
    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const { name, description, ownerId } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }
    
    const [newProject] = await db.insert(projects).values({
      name,
      description,
      ownerId,
    }).returning();
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

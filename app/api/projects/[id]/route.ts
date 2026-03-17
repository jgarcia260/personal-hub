import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const db = getDb();
    const { id } = await context.params;
    const body = await request.json();
    
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    
    if (!updatedProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

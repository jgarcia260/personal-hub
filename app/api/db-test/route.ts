import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get database connection (lazy-loaded)
    const db = getDb();
    
    // Test database connection with a simple query
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

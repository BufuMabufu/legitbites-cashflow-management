// =============================================================================
// GET /api/settings/maintenance
// =============================================================================
// Returns the current maintenance mode status from the SystemSetting table.
// Called by middleware (Edge Runtime) which cannot use Prisma directly.
//
// Response: { isActive: boolean }
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // This route uses Prisma, so Node.js runtime only

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "MAINTENANCE_MODE" },
      select: { value: true },
    });

    // If the setting doesn't exist, maintenance is OFF by default
    const isActive = setting?.value === "true";

    return NextResponse.json({ isActive });
  } catch {
    // On DB error, default to maintenance OFF to avoid locking users out
    return NextResponse.json({ isActive: false });
  }
}

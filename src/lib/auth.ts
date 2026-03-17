// =============================================================================
// Get Current User Helper
// =============================================================================
// Fetches the currently authenticated user from both Supabase Auth and our
// Prisma database. Returns null if not authenticated.
//
// WHY two lookups?
// - Supabase Auth: gives us the authenticated session (JWT verification)
// - Prisma User: gives us app-specific data (role, name) that controls UI
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { runCleanup } from "@/lib/cleanup";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "STAFF" | "ADMIN";
};

/**
 * Gets the current authenticated user with their role.
 * For use in Server Components and Server Actions.
 *
 * Returns `null` if the user is not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Look up the user in our database to get their role
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!dbUser) return null;

  // Fire-and-forget lazy cleanup of old soft-deleted records (> 5 mins)
  // This runs asynchronously and does not block the user's request.
  void runCleanup();

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
  };
}

// =============================================================================
// Authentication Server Actions
// =============================================================================
// Handles login and logout operations via Supabase Auth.
// These are Next.js Server Actions — they run exclusively on the server,
// which means credentials never touch the client-side JavaScript bundle.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Authenticates a user with email and password.
 *
 * WHY use a Server Action instead of a client-side call?
 * - Credentials stay on the server (never exposed in browser network tab)
 * - Automatic cookie management via the Supabase server client
 * - Progressive enhancement: works even if JavaScript is disabled
 *
 * After successful login, checks if the user exists in our `users` table.
 * If not (first login), creates a User record with default STAFF role.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input before hitting Supabase
  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email atau password salah. Silakan coba lagi." };
  }

  // WHY sync with our users table?
  // Supabase Auth manages authentication, but our app needs additional
  // user data (role, name) stored in Prisma. We upsert to handle both
  // first-time logins and returning users.
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email: data.user.email! },
      create: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.email!.split("@")[0], // Default name from email prefix
        role: "STAFF", // WHY default STAFF? Principle of least privilege.
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Signs the user out and redirects to the login page.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

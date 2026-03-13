// =============================================================================
// Login Page
// =============================================================================
// Clean, simple login form designed for non-technical users.
// Uses large buttons, clear labels, and prominent error messages.
// =============================================================================

"use client";

import { useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);

    // If login returns (didn't redirect), there was an error
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          {/* Logo / Brand */}
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🍽️</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            LegitBites
          </CardTitle>
          <CardDescription className="text-base">
            Masuk ke Cashflow Management
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form action={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm font-medium text-center">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                autoComplete="email"
                className="h-12 text-base rounded-xl px-4"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12 text-base rounded-xl px-4"
              />
            </div>

            {/* Submit Button — intentionally large for easy tapping */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Sedang masuk...
                </span>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

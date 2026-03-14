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
import Image from "next/image";

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 p-4">
      {/* Premium Background Blurs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <Card className="relative w-full max-w-md shadow-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-3xl z-10">
        <CardHeader className="text-center space-y-4 pt-8 pb-4">
          {/* Logo / Brand */}
          <div className="mx-auto w-28 h-28 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-500/10">
            {/* Animated Bolu Kukus Favicon */}
            <Image src="/icon.svg" alt="LegitBites Logo" width={80} height={80} className="object-contain drop-shadow-sm" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              LegitBites
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400">
              Cashflow Management
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 pt-2">
          <form action={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl p-4 text-sm font-medium text-center animate-in fade-in zoom-in-95 duration-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  className="h-14 text-base rounded-2xl px-5 bg-white/50 dark:bg-black/20 focus-visible:ring-emerald-500 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-14 text-base rounded-2xl px-5 bg-white/50 dark:bg-black/20 focus-visible:ring-emerald-500 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-2 text-lg font-bold rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk ke Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

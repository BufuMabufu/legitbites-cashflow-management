// =============================================================================
// Maintenance Page
// =============================================================================
// Static page shown to OWNER/STAFF users when MAINTENANCE_MODE is active.
// ADMIN users are never redirected here.
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sedang Maintenance — LegitBites",
  description: "Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-5xl" role="img" aria-label="Wrench">
                🔧
              </span>
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Sedang Maintenance
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base leading-relaxed mb-2">
          Sistem LegitBites sedang dalam proses pemeliharaan rutin.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Mohon bersabar, kami akan kembali online secepatnya. 🙏
        </p>

        {/* Divider */}
        <div className="border-t border-slate-700 mb-8" />

        {/* Info box */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Butuh bantuan segera? Hubungi administrator sistem.
          </p>
        </div>

        {/* Brand footer */}
        <p className="mt-8 text-slate-600 text-xs font-medium tracking-wider uppercase">
          LegitBites · Cashflow Management
        </p>
      </div>
    </div>
  );
}

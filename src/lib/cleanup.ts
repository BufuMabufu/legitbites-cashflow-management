// =============================================================================
// Resource Cleanup Utility
// =============================================================================
// Background process to permanently delete items (hard delete) 
// that have been softly deleted for more than 5 minutes.
// =============================================================================

import { prisma } from "./prisma";

// Debounce map to prevent multiple simultaneous cleanup queries
// Using a module-level variable to persist state between requests in a serverless cold start
let isCleaningUp = false;
let lastCleanupTime = 0;

export async function runCleanup() {
  const now = Date.now();
  
  // Throttle cleanups: only run at most once per minute globally per instance
  // to avoid spamming the database on every single auth check
  if (isCleaningUp || (now - lastCleanupTime) < 60 * 1000) {
    return;
  }

  isCleaningUp = true;
  lastCleanupTime = now;

  try {
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    // 1. Delete expired transactions
    await prisma.transaction.deleteMany({
      where: {
        deletedAt: {
          lte: fiveMinutesAgo
        }
      }
    });

    // 2. Delete expired categories
    await prisma.category.deleteMany({
      where: {
        deletedAt: {
          lte: fiveMinutesAgo
        }
      }
    });

    // Note: AuditLogs are typically meant to be immutable. We leave them intact 
    // for historical tracking unless specified otherwise.
    
  } catch (error) {
    console.error("Failed to run cleanup task:", error);
  } finally {
    isCleaningUp = false;
  }
}

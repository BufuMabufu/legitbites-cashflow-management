// =============================================================================
// AI Chat Page
// =============================================================================
// Server-side page that wraps the client-side ChatInterface component.
// Placed inside the (dashboard) route group so it inherits the sidebar layout.
// =============================================================================

import { ChatInterface } from "./chat-interface";

export const metadata = {
  title: "AI Chat — LegitBites",
  description: "Chat dengan asisten AI untuk insight keuangan bisnis kamu",
};

export default function ChatPage() {
  return <ChatInterface />;
}

// =============================================================================
// AI Chat Interface — Client Component
// =============================================================================
// Premium chat UI with streaming responses from Gemini 2.5 Flash.
// Features: chat bubbles, typing indicator, auto-scroll, suggested prompts,
// and markdown rendering for AI responses.
//
// Uses Vercel AI SDK v5's `useChat` hook with the new API:
// - `sendMessage({ text })` instead of `handleSubmit`
// - `status` ('ready' | 'streaming' | 'submitted' | 'error') instead of `isLoading`
// - `regenerate` instead of `reload`
// =============================================================================

"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Lightbulb,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Suggested prompts — shown in the empty state for quick start
// ---------------------------------------------------------------------------
const SUGGESTED_PROMPTS = [
  {
    icon: BarChart3,
    label: "Rangkum Keuangan Saya",
    prompt: "Rangkum kondisi keuangan bisnis saya saat ini. Bagaimana performanya?",
  },
  {
    icon: TrendingUp,
    label: "Analisis Pemasukan",
    prompt:
      "Analisis pemasukan saya bulan ini. Dari kategori mana yang paling besar?",
  },
  {
    icon: PiggyBank,
    label: "Tips Hemat Pengeluaran",
    prompt:
      "Lihat data pengeluaran saya dan berikan saran cara menghemat biaya",
  },
  {
    icon: Lightbulb,
    label: "Saran Bisnis",
    prompt:
      "Berdasarkan data keuangan saya, apa saran untuk meningkatkan omzet?",
  },
];

// ---------------------------------------------------------------------------
// Simple markdown-to-JSX renderer
// ---------------------------------------------------------------------------
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item, i) => (
      <li key={i}>{renderInline(item)}</li>
    ));
    if (listType === "ol") {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal list-inside space-y-1 my-2"
        >
          {items}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc list-inside space-y-1 my-2"
        >
          {items}
        </ul>
      );
    }
    listBuffer = [];
    listType = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ordered list item
    const olMatch = line.match(/^\d+[.)]\s+(.*)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listBuffer.push(olMatch[1]);
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Not a list item — flush any pending list
    flushList();

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-bold text-base mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-bold text-lg mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-bold text-xl mt-3 mb-1">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={match.index} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ---------------------------------------------------------------------------
// Helper: extract text content from UIMessage parts
// ---------------------------------------------------------------------------
function getMessageText(message: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  // AI SDK v5 uses `parts` array; fallback to `content` for compatibility
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  return message.content ?? "";
}

// ---------------------------------------------------------------------------
// Typing Indicator — animated dots
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Chat Interface Component
// ---------------------------------------------------------------------------
export function ChatInterface() {
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    setMessages,
  } = useChat();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handleScroll = () => {
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-resize textarea
  const handleTextareaInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  // Submit message
  const submitMessage = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  // Handle Enter to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const scrollToBottom = () => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]">
      {/* --- Header --- */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Legi AI</h1>
            <p className="text-sm text-muted-foreground">
              Asisten keuangan pintar • Gemini 2.5 Flash
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Hapus Chat
          </Button>
        )}
      </div>

      {/* --- Messages Area --- */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto py-4 space-y-1 relative scroll-smooth"
      >
        {/* Empty State */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-6">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Halo! Saya Legi 👋</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Asisten keuangan AI kamu. Saya bisa <strong>membaca data keuangan</strong> kamu secara real-time.
              Tanyakan tentang pemasukan, pengeluaran, tren, atau minta saran bisnis!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSuggestedPrompt(item.prompt)}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
                    <item.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => {
          const text = getMessageText(message as { parts?: Array<{ type: string; text?: string }>; content?: string });
          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 px-2 py-2 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  message.role === "user"
                    ? "bg-linear-to-br from-emerald-500 to-teal-600"
                    : "bg-linear-to-br from-violet-500 to-indigo-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] md:max-w-[70%] ${
                  message.role === "user"
                    ? "bg-linear-to-br from-emerald-500 to-teal-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md shadow-emerald-500/10"
                    : "bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {text}
                  </p>
                ) : (
                  <div className="text-sm prose-sm">
                    {renderMarkdown(text)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && <TypingIndicator />}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Card className="px-4 py-3 border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-3">
                <p className="text-sm text-destructive">
                  Ups, terjadi kesalahan. Coba lagi?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerate()}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  Coba Lagi
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="flex justify-center -mt-12 mb-2 relative z-10">
          <button
            onClick={scrollToBottom}
            className="bg-card border border-border shadow-lg rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ↓ Scroll ke bawah
          </button>
        </div>
      )}

      {/* --- Input Area --- */}
      <div className="shrink-0 pt-3 border-t border-border/50">
        <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu ke Legi..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all max-h-40 scrollbar-thin"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-md shadow-violet-500/25 transition-all disabled:opacity-40 disabled:shadow-none shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground/60 mt-2">
          Legi menggunakan Gemini 2.5 Flash • Jawaban bersifat saran, bukan
          keputusan final
        </p>
      </div>
    </div>
  );
}

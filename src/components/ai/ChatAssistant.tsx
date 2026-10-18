"use client";
// src/components/ai/ChatAssistant.tsx
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, MessageCircle, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  "How do I file a complaint?",
  "What is my water quality status?",
  "How do I report an emergency?",
  "Show me active alerts",
];

export function ChatAssistant() {
  const { data: session } = useSession();
  const [open, setOpen]       = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${session?.user?.name?.split(" ")[0] ?? "there"}! I am the N.E.S.T. Assistant. I can help you file complaints, check water quality, navigate the platform, or answer any neighborhood safety questions. How can I help?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open, minimized]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== "welcome")
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId, history }),
      });
      const data = await res.json();

      if (data.success) {
        if (!sessionId) setSessionId(data.data.sessionId);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.data.message,
          timestamp: new Date(),
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I am having trouble responding right now. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }]);
    setSessionId(null);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {open && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 w-[360px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col transition-all",
          minimized ? "h-14" : "h-[520px]"
        )}>
          <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">N.E.S.T. Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <p className="text-[10px] text-blue-100">Online · AI powered</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Clear chat">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMinimized(!minimized)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Minimize">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Close">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-600 hover:border-blue-200 px-2.5 py-1.5 rounded-full transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about N.E.S.T...."
                  disabled={loading}
                  className="flex-1 h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

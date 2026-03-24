"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "lily";
  text: string;
}

const LILY_GREETINGS = [
  "Hi! I'm Lily, your InsureConnect assistant. How can I help you today?",
  "Need help understanding your policy or finding the right coverage? Ask me anything!"
];

export default function LilyChatWidget(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "lily",
      text: LILY_GREETINGS[0] ?? "Hi! I'm Lily, your InsureConnect assistant."
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated Lily response — TODO: wire to actual AI endpoint
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `l-${Date.now()}`,
          role: "lily",
          text: "Thanks for your message! A licensed agent will follow up shortly. In the meantime, you can view your policies on the dashboard."
        }
      ]);
    }, 800);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="flex w-80 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-soft">
          {/* Header */}
          <div className="flex items-center gap-3 bg-pine px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              L
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Lily</p>
              <p className="text-xs text-white/70">InsureConnect AI Assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  m.role === "lily"
                    ? "self-start bg-gray-100 text-ink"
                    : "self-end bg-pine text-white"
                ].join(" ")}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 border-t border-gray-100 px-3 py-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lily anything…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-lg bg-pine px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-pine-dark transition-colors"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Lily chat" : "Open Lily chat"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-pine text-white shadow-soft transition-transform hover:scale-105 hover:bg-pine-dark"
      >
        {open ? (
          <span className="text-lg font-bold">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Who is Shahwaiz?",
  "What's he working on?",
  "How can I reach him?",
];

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const latestAssistant =
    [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const latestUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setError(null);

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(0, -1), // drop the empty assistant placeholder
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showResponse = messages.length > 0;
  const isThinking =
    isStreaming &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.content === "";

  return (
    <div className="w-full">
      {/* Profile bubble */}
      <div className="flex justify-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-bg-elevated border border-border flex items-center justify-center overflow-hidden">
            {/* Tries the dashboard-uploaded pfp first, falls back to the static SVG */}
            <img
              src="/api/pfp"
              alt="Shahwaiz"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.src.endsWith("/pfp.svg")) img.src = "/pfp.svg";
              }}
            />
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-bg"
            title="online"
          />
        </motion.div>
      </div>

      {/* Response area */}
      <div className="min-h-[120px] mb-4">
        <AnimatePresence mode="popLayout">
          {showResponse && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl bg-bg-elevated border border-border-subtle p-5 md:p-6"
            >
              {latestUser && (
                <p className="text-xs text-fg-subtle mb-2 font-mono">
                  you asked: {latestUser}
                </p>
              )}
              {isThinking ? (
                <div className="flex items-center py-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              ) : (
                <StreamingText text={latestAssistant} />
              )}
              {error && (
                <p className="text-xs text-red-300 mt-3">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="rounded-2xl bg-bg-elevated border border-border-subtle focus-within:border-border transition-colors">
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="ask me anything about shahwaiz..."
            className="flex-1 resize-none bg-transparent outline-none text-fg placeholder:text-fg-subtle text-[15px] leading-6 max-h-[200px]"
            disabled={isStreaming}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className="shrink-0 w-8 h-8 rounded-full bg-fg text-bg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-fg-muted transition-all"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {!showResponse && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
              onClick={() => send(s)}
              className="text-xs text-fg-muted px-3 py-1.5 rounded-full border border-border-subtle hover:border-border hover:text-fg transition-colors"
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function StreamingText({ text }: { text: string }) {
  return (
    <p className="text-[15px] leading-relaxed text-fg whitespace-pre-wrap">
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-fg/50 translate-y-[2px] ml-0.5 animate-pulse" />
    </p>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Keep scroll pinned to the most recent message or typing indicator
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const ask = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    const userMsg: Message = { role: "user", content: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/ask?q=${encodeURIComponent(question)}`
      );

      if (!res.ok) {
        const detail = await res.text();
        const errorMsg: Message = {
          role: "assistant",
          content:
            detail ||
            "Backend error while answering. Check that the server is running and documents are indexed.",
        };
        setMessages((m) => [...m, errorMsg]);
        return;
      }

      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.answer };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        role: "assistant",
        content: "Sorry, there was an issue getting the answer. Please try again.",
      };
      setMessages((m) => [...m, errorMsg]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full border rounded-lg bg-background">
      <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
        <div className="space-y-3">
          {!hasMessages && !loading && (
            <div className="text-sm text-muted-foreground text-left">
              Ask a question about your uploaded documents to get started.
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`group relative p-3 rounded-lg max-w-xl ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              }`}
            >
              <div className="whitespace-pre-wrap text-left">{m.content}</div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-10 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => navigator.clipboard.writeText(m.content)}
                title="Copy message"
              >
                Copy
              </Button>
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded-lg max-w-xl bg-muted animate-pulse text-muted-foreground">
              Assistant is thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your document..."
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="border-2 border-muted-foreground/50 focus-visible:ring-2"
          disabled={loading}
        />
        <Button onClick={ask} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setMessages([])}
          disabled={loading || !hasMessages}
        >
          New chat
        </Button>
      </div>
    </div>
  );
}

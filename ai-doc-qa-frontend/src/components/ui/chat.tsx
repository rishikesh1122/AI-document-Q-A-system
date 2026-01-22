import { useState } from "react";
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-xl ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your document..."
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <Button onClick={ask} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

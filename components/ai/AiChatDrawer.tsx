"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useFirestoreCollection } from "@/lib/hooks/useFirestore";
import { encryptPayload, decryptPayload } from "@/lib/security";

interface Message {
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
}

export function AiChatDrawer() {
  const { profile } = useAuth();
  const { data: schedules = [] } = useFirestoreCollection("schedules");
  const { data: courses = [] } = useFirestoreCollection("courses");
  const { data: rooms = [] } = useFirestoreCollection("rooms");

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Set initial contextual welcome message once profile is loaded
  useEffect(() => {
    if (profile) {
      setMessages([
        {
          role: "assistant",
          content: `Hello, Prof. ${profile.displayName || "Doe"}! I have connected to your active FacultyWise schedules. Ask me anything about your current ${profile.role === "teacher" ? "assigned load" : "classes"}, classroom conflicts, or optimal timings!`,
        },
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I am your FacultyWise AI Scheduling Assistant. Ask me anything about timetable generation, conflict resolution, or teacher load optimization!",
        },
      ]);
    }
  }, [profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Package all query context securely to send for server-side prompt construction
      const rawPayload = {
        userQuery: userMessage,
        profile,
        schedules,
        courses,
        rooms
      };

      // Encrypt the payload to hexadecimal binary-like string
      const encryptedPayload = encryptPayload(rawPayload);

      const response = await fetch("/api/ai-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: encryptedPayload }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        // If server sent encrypted error, decrypt it, otherwise show raw
        let displayError = errorBody.error || `Server responded with status ${response.status}`;
        if (errorBody.data) {
          try {
            const decryptedErr = decryptPayload(errorBody.data);
            displayError = decryptedErr.error || displayError;
          } catch {}
        }
        throw new Error(displayError);
      }

      const resBody = await response.json();
      if (!resBody.data) {
        throw new Error("Invalid response format received from server");
      }

      // Decrypt response payload
      const decryptedResult = decryptPayload(resBody.data);

      if (decryptedResult.error) {
        throw new Error(decryptedResult.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: decryptedResult.answer,
          creditsUsed: decryptedResult.credits_used,
        },
      ]);
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      setError(err.message || "Failed to communicate with FacultyWise AI.");
    } finally {
      setLoading(false);
    }
  };

  // Renders the rich-text content beautifully, parsing basic markdown structures
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => {
      let cleanLine = line.trim();

      if (!cleanLine) {
        return <div key={lineIndex} className="h-2" />;
      }

      // Check for markdown bullet markers
      const isBullet = cleanLine.startsWith("* ") || cleanLine.startsWith("- ") || cleanLine.startsWith("• ");
      if (isBullet) {
        cleanLine = cleanLine.replace(/^(\*\s*|-\s*|•\s*)/, "");
      }

      // Split line to parse double-asterisks **bold** text
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const elements = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={partIndex} className="font-bold text-stone-900">
              {boldText}
            </strong>
          );
        }
        // Remove any leftover raw asterisks
        return part.replace(/\*/g, "");
      });

      if (isBullet) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 ml-2 my-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
            <span className="text-stone-700 leading-relaxed text-xs">{elements}</span>
          </div>
        );
      }

      return (
        <p key={lineIndex} className="text-stone-800 leading-relaxed text-xs my-0.5">
          {elements}
        </p>
      );
    });
  };

  return (
    <>
      {/* Pulse Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 hover:scale-110 hover:bg-stone-800 cursor-pointer"
        aria-label="Ask AI Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-stone-950 animate-ping opacity-25"></span>
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="text-amber-400 animate-pulse" />}
      </button>

      {/* Floating Chat Drawer Container */}
      <div
        className={`fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 flex h-[50vh] sm:h-[500px] md:h-[580px] w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-120px)] flex-col rounded-[2rem] border border-white/70 bg-white/90 p-4 sm:p-5 shadow-[0_20px_50px_rgba(40,30,15,0.2)] backdrop-blur-xl transition-all duration-500 transform ${
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">FacultyWise AI</h3>
              <p className="text-[10px] font-medium text-amber-700 uppercase tracking-widest flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Service
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-stone-400 hover:text-stone-600 transition p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 max-w-[85%] ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 border rounded-bl-none text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-stone-900 text-white rounded-br-none border-stone-950 shadow-sm"
                    : "bg-white/80 text-stone-800 rounded-bl-none border-stone-200/50 shadow-sm"
                }`}
              >
                {renderMessageContent(msg.content)}
              </div>
              {msg.creditsUsed && (
                <span className="text-[9px] font-mono text-stone-400 px-1 mt-0.5">
                  ⚡ API Credits: {msg.creditsUsed}
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex flex-col gap-1 max-w-[85%] mr-auto items-start">
              <div className="rounded-2xl px-4 py-3 bg-white/80 border border-stone-200/50 rounded-bl-none shadow-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-50 rounded-xl border border-red-100 text-red-600">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="mt-2 pt-3 border-t border-stone-200/50 flex gap-2">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none transition focus:border-amber-400 focus:bg-white placeholder:text-stone-400 text-stone-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-950 text-white transition hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

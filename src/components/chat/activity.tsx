"use client";

import { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronDown, Loader2, X } from "lucide-react";

import type { ChatMessage } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export const MessagesContext = createContext<Map<string, ChatMessage>>(new Map());

export function useChatMessage(id: string | undefined) {
  return id ? useContext(MessagesContext).get(id) : undefined;
}

export function ActivityPanel({ message, running }: { message: ChatMessage; running: boolean }) {
  const [open, setOpen] = useState<boolean | null>(null);
  const steps = message.steps ?? [];
  const reasoning = message.reasoning?.trim();
  if (!steps.length && !reasoning) return null;

  const isOpen = open ?? running;
  const current = [...steps].reverse().find((s) => s.status === "running");
  const summary = running
    ? (current ? `${current.agent ? current.agent + " · " : ""}${current.label}` : "يفكر…")
    : `اكتمل العمل · ${steps.length} خطوات`;

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-sm"
      >
        <span className="flex size-6 items-center justify-center rounded-lg bg-accent text-primary">
          {running ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
        </span>
        <span className={cn("flex-1 truncate font-medium", running && "shimmer-text")}>{summary}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border"
          >
            <ol className="space-y-2.5 px-3.5 py-3">
              {steps.map((s) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2.5 text-sm"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      s.status === "done" && "bg-primary text-primary-foreground",
                      s.status === "running" && "bg-accent text-primary",
                      s.status === "error" && "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {s.status === "done" ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : s.status === "error" ? (
                      <X className="size-3" />
                    ) : (
                      <Loader2 className="size-3 animate-spin" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">
                      {s.agent && (
                        <span className="me-1.5 rounded-md bg-accent px-1.5 py-0.5 text-xs font-semibold text-primary">
                          {s.agent}
                        </span>
                      )}
                      <span className="text-foreground/90">{s.label}</span>
                    </p>
                    {s.detail && (
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {s.detail}
                      </p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
            {reasoning && (
              <div className="max-h-60 overflow-y-auto border-t border-border px-3.5 py-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {reasoning}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowDown, Code2, Lightbulb, PenLine, Sparkles } from "lucide-react";
import { ThreadPrimitive } from "@assistant-ui/react";

import { AssistantMessage, UserMessage } from "@/components/chat/messages";
import { Composer } from "@/components/chat/composer";
import { AriaMark } from "@/components/chat/brand";

const SUGGESTIONS = [
  { icon: PenLine, label: "Draft a warm welcome email for new customers" },
  { icon: Code2, label: "Explain async/await in JavaScript with an example" },
  { icon: Lightbulb, label: "Give me 5 creative names for a coffee brand" },
  { icon: Sparkles, label: "Summarize the theory of relativity simply" },
];

function Welcome() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 size-16 overflow-hidden rounded-2xl border border-border bg-card shadow-float"
      >
        <img src={AriaMark} alt="Aria" width={64} height={64} className="size-full object-contain p-2" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        How can I help you today?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="mt-3 max-w-md text-center text-muted-foreground"
      >
        Ask anything — get streaming answers with rich formatting and beautiful code.
      </motion.p>

      <div className="mt-9 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 + i * 0.06 }}
          >
            <ThreadPrimitive.Suggestion prompt={s.label} method="replace" autoSend asChild>
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium leading-snug text-foreground/90">
                  {s.label}
                </span>
              </button>
            </ThreadPrimitive.Suggestion>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col overflow-hidden bg-background">
      <ThreadPrimitive.Viewport className="relative flex-1 overflow-y-auto">
        <ThreadPrimitive.Empty>
          <Welcome />
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.If empty={false}>
          <div className="flex flex-col pt-4 pb-2">
            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage }}
            />
          </div>
        </ThreadPrimitive.If>

        <div className="sticky bottom-0">
          <div className="relative mx-auto max-w-3xl">
            <ThreadPrimitive.ScrollToBottom asChild>
              <button
                type="button"
                aria-label="Scroll to bottom"
                className="absolute -top-12 left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-float transition-opacity hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowDown className="size-4" />
              </button>
            </ThreadPrimitive.ScrollToBottom>
          </div>
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

"use client";

import { motion } from "framer-motion";
import { Check, Copy, RefreshCw } from "lucide-react";
import {
  ActionBarPrimitive,
  MessagePrimitive,
  type TextMessagePartComponent,
} from "@assistant-ui/react";

import { Markdown } from "@/components/chat/markdown";
import { AriaMark } from "@/components/chat/brand";
import { cn } from "@/lib/utils";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2" aria-label="Aria is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-primary/70"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  );
}

const AssistantText: TextMessagePartComponent = ({ text, status }) => {
  const running = status?.type === "running";
  if (running && !text) return <TypingDots />;
  return (
    <div className={cn(running && "streaming-caret")}>
      <Markdown content={text} />
    </div>
  );
};

const UserText: TextMessagePartComponent = ({ text }) => (
  <span className="whitespace-pre-wrap break-words">{text}</span>
);

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
      {children}
    </span>
  );
}

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="group/msg mx-auto flex w-full max-w-3xl gap-3.5 px-4 py-5 sm:px-6"
      >
        <div className="mt-0.5 size-8 shrink-0 overflow-hidden rounded-full border border-border bg-card shadow-soft">
          <img src={AriaMark} alt="Aria" width={32} height={32} className="size-full object-contain p-1" />
        </div>
        <div className="min-w-0 flex-1">
          <MessagePrimitive.Parts components={{ Text: AssistantText }} />
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            autohideFloat="single-branch"
            className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 data-[floating]:opacity-100"
          >
            <ActionBarPrimitive.Copy asChild>
              <button type="button" aria-label="Copy">
                <IconButton>
                  <MessagePrimitive.If copied>
                    <Check className="size-4" />
                  </MessagePrimitive.If>
                  <MessagePrimitive.If copied={false}>
                    <Copy className="size-4" />
                  </MessagePrimitive.If>
                </IconButton>
              </button>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
              <button type="button" aria-label="Regenerate">
                <IconButton>
                  <RefreshCw className="size-4" />
                </IconButton>
              </button>
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>
        </div>
      </motion.div>
    </MessagePrimitive.Root>
  );
}

export function UserMessage() {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-3xl justify-end px-4 py-2.5 sm:px-6"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-user-bubble px-4 py-2.5 text-[0.95rem] leading-relaxed text-user-bubble-foreground shadow-soft">
          <MessagePrimitive.Parts components={{ Text: UserText }} />
        </div>
      </motion.div>
    </MessagePrimitive.Root>
  );
}

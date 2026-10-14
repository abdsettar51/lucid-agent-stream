"use client";

import { ArrowUp, Square, User, Users } from "lucide-react";
import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";

import { setMode, useAgentState } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

function ModeToggle() {
  const { mode } = useAgentState();
  const opts = [
    { v: "single" as const, label: "مساعد واحد", icon: User },
    { v: "team" as const, label: "فريق وكلاء", icon: Users },
  ];
  return (
    <div className="mb-2 flex justify-center" dir="rtl">
      <div className="flex gap-1 rounded-full border border-border bg-card/90 p-1 shadow-soft backdrop-blur-xl">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setMode(o.v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              mode === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <o.icon className="size-3.5" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Composer() {
  const { agents, activeId } = useAgentState();
  const name = agents.find((a) => a.id === activeId)?.name ?? "Aria";
  return (
    <div className="pointer-events-none sticky bottom-0 z-10 px-3 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl">
        <ModeToggle />
        <ComposerPrimitive.Root className="relative flex items-end gap-2 rounded-3xl border border-border bg-card/90 p-2 pl-4 shadow-float backdrop-blur-xl transition-colors focus-within:border-primary/50">
          <ComposerPrimitive.Input
            autoFocus
            rows={1}
            submitOnEnter
            placeholder={`اكتب إلى ${name}…`}
            className="aria-textarea max-h-44 min-h-[2.75rem] flex-1 resize-none bg-transparent py-2.5 text-[0.97rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />

          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send asChild>
              <button
                type="button"
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-soft transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <ArrowUp className="size-5" strokeWidth={2.4} />
              </button>
            </ComposerPrimitive.Send>
          </ThreadPrimitive.If>

          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <button
                type="button"
                aria-label="Stop generating"
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-soft transition-all hover:opacity-90 active:scale-95"
              >
                <Square className="size-4 fill-current" />
              </button>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </ComposerPrimitive.Root>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Aria can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

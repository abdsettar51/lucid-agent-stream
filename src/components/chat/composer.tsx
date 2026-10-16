"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp, Brain, Check, Code2, Lightbulb, ListChecks, PenLine, Plus, Square, Telescope, User, Users, X,
} from "lucide-react";
import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";

import { SKILLS, type SkillId, setMode, setSkill, useAgentState, useSkill } from "@/lib/agent-store";
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

const SKILL_ICONS: Record<SkillId, typeof Brain> = {
  "deep-think": Brain,
  "deep-research": Telescope,
  code: Code2,
  write: PenLine,
  summarize: ListChecks,
  brainstorm: Lightbulb,
};

function SkillsMenu() {
  const skill = useSkill();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0" dir="rtl">
      <button
        type="button"
        aria-label="المهارات"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex size-10 items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
          open && "rotate-45 bg-accent text-foreground",
        )}
      >
        <Plus className="size-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          />
        )}
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 rounded-t-3xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-float sm:absolute sm:inset-x-auto sm:bottom-12 sm:left-0 sm:block sm:w-72 sm:space-y-0.5 sm:rounded-2xl sm:p-1.5"
          >
            <div className="col-span-2 mb-1 flex flex-col items-center gap-2 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-muted" />
              <p className="text-sm font-semibold">اختر مهارة</p>
            </div>
            {SKILLS.map((s) => {
              const Icon = SKILL_ICONS[s.id];
              const active = skill === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSkill(active ? null : s.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition-colors hover:bg-accent",
                    active && "bg-accent",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-primary" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{s.hint}</span>
                  </span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveSkillChip() {
  const skill = useSkill();
  const s = SKILLS.find((x) => x.id === skill);
  if (!s) return null;
  const Icon = SKILL_ICONS[s.id];
  return (
    <button
      type="button"
      onClick={() => setSkill(null)}
      className="mb-1 flex shrink-0 items-center gap-1.5 self-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
      dir="rtl"
    >
      <Icon className="size-3.5" />
      {s.label}
      <X className="size-3" />
    </button>
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
          <SkillsMenu />
          <ActiveSkillChip />
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

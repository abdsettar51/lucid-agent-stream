"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";

import {
  type Agent,
  type ThinkingDepth,
  EMOJIS,
  PERSONALITY_PRESETS,
  deleteAgent,
  saveAgent,
  useAgentState,
} from "@/lib/agent-store";
import { genId } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

const DEPTHS: { v: ThinkingDepth; label: string }[] = [
  { v: "low", label: "سريع" },
  { v: "medium", label: "متوازن" },
  { v: "high", label: "عميق" },
];

export function AgentSettings({
  agentId,
  onClose,
}: {
  agentId: string | "new" | null;
  onClose: () => void;
}) {
  const { agents } = useAgentState();
  const [draft, setDraft] = useState<Agent | null>(null);

  useEffect(() => {
    if (!agentId) return setDraft(null);
    const existing = agents.find((a) => a.id === agentId);
    setDraft(
      existing ?? {
        id: genId(),
        name: "",
        emoji: "🤖",
        personality: PERSONALITY_PRESETS[1].text,
        depth: "medium",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const isNew = agentId === "new";
  const set = (p: Partial<Agent>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <AnimatePresence>
      {agentId && draft && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-float sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                {isNew ? "مساعد جديد" : "تخصيص المساعد"}
              </h2>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <label className="mb-1.5 block text-sm font-medium">الاسم</label>
            <input
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="مثلاً: نور، صديقي، المستشار…"
              className="mb-4 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
            />

            <label className="mb-1.5 block text-sm font-medium">الرمز</label>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set({ emoji: e })}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border text-lg transition-all",
                    draft.emoji === e ? "border-primary bg-accent" : "border-border hover:bg-accent/60",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="mb-1.5 block text-sm font-medium">العقلية والشخصية</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PERSONALITY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set({ personality: p.text })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    draft.personality === p.text
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <textarea
              value={draft.personality}
              onChange={(e) => set({ personality: e.target.value })}
              rows={4}
              placeholder="صف كيف تريده أن يفكر ويتكلم…"
              className="mb-4 w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-primary/60"
            />

            <label className="mb-1.5 block text-sm font-medium">عمق التفكير</label>
            <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1">
              {DEPTHS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => set({ depth: d.v })}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium transition-all",
                    draft.depth === d.v ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!draft.name.trim()}
                onClick={() => {
                  saveAgent({ ...draft, name: draft.name.trim() });
                  onClose();
                }}
                className="flex-1 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105 disabled:opacity-40"
              >
                حفظ
              </button>
              {!isNew && agents.length > 1 && (
                <button
                  type="button"
                  aria-label="حذف المساعد"
                  onClick={() => {
                    deleteAgent(draft.id);
                    onClose();
                  }}
                  className="flex size-12 items-center justify-center rounded-xl border border-border text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

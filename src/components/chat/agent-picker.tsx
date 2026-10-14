"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";

import { AgentSettings } from "@/components/chat/agent-settings";
import { setActiveAgent, useAgentState } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

export function AgentPicker() {
  const { agents, activeId } = useAgentState();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="px-3 pb-1 pt-2" dir="rtl">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">مساعدوك</span>
        <button
          type="button"
          aria-label="مساعد جديد"
          onClick={() => setEditing("new")}
          className="flex size-6 items-center justify-center rounded-md text-primary hover:bg-accent"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {agents.map((a) => (
          <li key={a.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveAgent(a.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                a.id === activeId
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              <span className="text-base">{a.emoji}</span>
              <span className="truncate">{a.name}</span>
            </button>
            <button
              type="button"
              aria-label={`تخصيص ${a.name}`}
              onClick={() => setEditing(a.id)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <AgentSettings agentId={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

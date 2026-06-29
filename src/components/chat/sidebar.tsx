"use client";

import { useSyncExternalStore } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Trash2, MessagesSquare } from "lucide-react";

import { AriaLogo } from "@/components/chat/brand";
import {
  deleteThread,
  genId,
  getServerSnapshot,
  getThreadsSnapshot,
  subscribe,
  type ChatThread,
} from "@/lib/chat-store";
import { cn } from "@/lib/utils";

function useThreads(): ChatThread[] {
  return useSyncExternalStore(subscribe, getThreadsSnapshot, getServerSnapshot);
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const threads = useThreads();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const newChat = () => {
    onNavigate?.();
    navigate({ to: "/c/$threadId", params: { threadId: genId() } });
  };

  const remove = (id: string) => {
    deleteThread(id);
    if (id === activeId) {
      const next = getThreadsSnapshot().find((t) => t.id !== id);
      if (next) navigate({ to: "/c/$threadId", params: { threadId: next.id } });
      else navigate({ to: "/c/$threadId", params: { threadId: genId() } });
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link to="/" onClick={onNavigate} className="transition-opacity hover:opacity-80">
          <AriaLogo />
        </Link>
      </div>

      <div className="px-3 pb-2 pt-2">
        <button
          type="button"
          onClick={newChat}
          className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-card/50 px-3.5 py-2.5 text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-float"
        >
          <MessageSquarePlus className="size-4 text-primary" />
          New conversation
        </button>
      </div>

      <div className="px-4 pb-1 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          History
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <MessagesSquare className="size-7 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Your conversations will appear here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {threads.map((t) => {
                const active = t.id === activeId;
                return (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group relative"
                  >
                    <Link
                      to="/c/$threadId"
                      params={{ threadId: t.id }}
                      onClick={onNavigate}
                      className={cn(
                        "block truncate rounded-lg py-2 pl-3 pr-9 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                      )}
                    >
                      {t.title}
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      onClick={() => remove(t.id)}
                      className={cn(
                        "absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100",
                        active && "opacity-70",
                      )}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Saved on this device · Powered by Lovable AI
        </p>
      </div>
    </div>
  );
}

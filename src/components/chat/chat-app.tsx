"use client";

import { useMemo, useState } from "react";
import { MessagesContext } from "@/components/chat/activity";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageSquarePlus, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Sidebar } from "@/components/chat/sidebar";
import { Thread } from "@/components/chat/thread";
import { AriaLogo } from "@/components/chat/brand";
import { useAriaRuntime } from "@/hooks/use-aria-runtime";
import { genId } from "@/lib/chat-store";

function RuntimeRegion({ threadId }: { threadId: string }) {
  const { runtime, messages } = useAriaRuntime(threadId);
  const map = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MessagesContext.Provider value={map}>
        <Thread />
      </MessagesContext.Provider>
    </AssistantRuntimeProvider>
  );
}

export function ChatApp({ threadId }: { threadId: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border md:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border shadow-float"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-3 z-10 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-3 py-2.5 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent"
          >
            <Menu className="size-5" />
          </button>
          <AriaLogo />
          <button
            type="button"
            aria-label="New conversation"
            onClick={() => navigate({ to: "/c/$threadId", params: { threadId: genId() } })}
            className="flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-accent"
          >
            <MessageSquarePlus className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1">
          <RuntimeRegion key={threadId} threadId={threadId} />
        </div>
      </main>
    </div>
  );
}

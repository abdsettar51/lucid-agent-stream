"use client";

import { useState } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Menu, MessageSquarePlus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Sidebar } from "@/components/chat/sidebar";
import { Thread } from "@/components/chat/thread";
import { AriaLogo } from "@/components/chat/brand";
import { useAriaRuntime } from "@/hooks/use-aria-runtime";
import { genId } from "@/lib/chat-store";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function RuntimeRegion({ threadId }: { threadId: string }) {
  const runtime = useAriaRuntime(threadId);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
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

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ChatApp } from "@/components/chat/chat-app";
import { LoaderScreen } from "@/components/chat/loader";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: "Aria — Conversation" },
      { name: "description", content: "Your conversation with Aria, your premium AI assistant." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConversationPage,
});

function ConversationPage() {
  const { threadId } = Route.useParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chat is fully client-side (localStorage + streaming), so render after mount
  // to avoid SSR/hydration mismatches.
  if (!mounted) return <LoaderScreen />;

  return <ChatApp threadId={threadId} />;
}

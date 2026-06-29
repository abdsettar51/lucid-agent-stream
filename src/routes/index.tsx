import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { LoaderScreen } from "@/components/chat/loader";
import { genId, getThreadsSnapshot } from "@/lib/chat-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aria — Premium AI Chat" },
      {
        name: "description",
        content:
          "Chat with Aria, a premium AI assistant featuring streaming replies, rich Markdown, syntax-highlighted code, and saved conversations.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const threads = getThreadsSnapshot();
    const id = threads[0]?.id ?? genId();
    navigate({ to: "/c/$threadId", params: { threadId: id }, replace: true });
  }, [navigate]);

  return <LoaderScreen />;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";

import {
  type ChatMessage,
  genId,
  getThread,
  setThreadMessages,
} from "@/lib/chat-store";

type ContentPart = AppendMessage["content"][number];

function extractText(content: AppendMessage["content"]): string {
  return content
    .filter((p: ContentPart): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

function toModelMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.content.length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

const convertMessage = (m: ChatMessage): ThreadMessageLike => ({
  role: m.role,
  content: [{ type: "text", text: m.content }],
  id: m.id,
  createdAt: new Date(m.createdAt),
});

export function useAriaRuntime(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => getThread(threadId)?.messages ?? [],
  );
  const [isRunning, setIsRunning] = useState(false);
  const msgsRef = useRef<ChatMessage[]>(messages);
  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef(threadId);

  const setLive = useCallback((next: ChatMessage[]) => {
    msgsRef.current = next;
    setMessages(next);
  }, []);

  const persistNow = useCallback(() => {
    setThreadMessages(threadIdRef.current, msgsRef.current);
  }, []);

  // Reset state when switching to another thread.
  useEffect(() => {
    threadIdRef.current = threadId;
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    const loaded = getThread(threadId)?.messages ?? [];
    msgsRef.current = loaded;
    setMessages(loaded);
  }, [threadId]);

  const stream = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: toModelMessages(history) }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          throw new Error(detail || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setLive(
            msgsRef.current.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
          );
        }
        persistNow();
      } catch (err) {
        const e = err as Error;
        if (e.name !== "AbortError") {
          const note = `⚠️ ${e.message || "Something went wrong while generating a response."}`;
          setLive(
            msgsRef.current.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content ? `${m.content}\n\n${note}` : note }
                : m,
            ),
          );
        }
        persistNow();
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [persistNow, setLive],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = extractText(message.content);
      if (!text) return;
      const now = Date.now();
      const userMsg: ChatMessage = { id: genId(), role: "user", content: text, createdAt: now };
      const assistantMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "",
        createdAt: now + 1,
      };
      const history = [...msgsRef.current, userMsg];
      setLive([...history, assistantMsg]);
      persistNow();
      await stream(history, assistantMsg.id);
    },
    [persistNow, setLive, stream],
  );

  const onReload = useCallback(async () => {
    const trimmed = [...msgsRef.current];
    while (trimmed.length && trimmed[trimmed.length - 1].role === "assistant") trimmed.pop();
    if (!trimmed.length) return;
    const assistantMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    setLive([...trimmed, assistantMsg]);
    persistNow();
    await stream(trimmed, assistantMsg.id);
  }, [persistNow, setLive, stream]);

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  return useExternalStoreRuntime({
    messages,
    isRunning,
    convertMessage,
    onNew,
    onReload,
    onCancel,
  });
}

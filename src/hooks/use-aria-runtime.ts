"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";

import {
  type ActivityStep,
  type ChatMessage,
  genId,
  getThread,
  setThreadMessages,
} from "@/lib/chat-store";
import { getActiveAgent, getAgentState } from "@/lib/agent-store";

type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "step"; step: ActivityStep }
  | { type: "error"; message: string };

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
      const agent = getActiveAgent();
      const { mode } = getAgentState();
      const patch = (fn: (m: ChatMessage) => ChatMessage) =>
        setLive(msgsRef.current.map((m) => (m.id === assistantId ? fn(m) : m)));
      patch((m) => ({ ...m, agentName: agent.name, agentEmoji: agent.emoji, steps: [] }));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: toModelMessages(history),
            agent: { name: agent.name, personality: agent.personality, depth: agent.depth },
            mode,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          throw new Error(detail || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        const handle = (line: string) => {
          if (!line.trim()) return;
          let ev: StreamEvent;
          try {
            ev = JSON.parse(line) as StreamEvent;
          } catch {
            return;
          }
          if (ev.type === "text") patch((m) => ({ ...m, content: m.content + ev.delta }));
          else if (ev.type === "reasoning")
            patch((m) => ({ ...m, reasoning: (m.reasoning ?? "") + ev.delta }));
          else if (ev.type === "step")
            patch((m) => {
              const steps = [...(m.steps ?? [])];
              const i = steps.findIndex((s) => s.id === ev.step.id);
              if (i === -1) steps.push(ev.step);
              else steps[i] = { ...steps[i], ...ev.step };
              return { ...m, steps };
            });
          else if (ev.type === "error") throw new Error(ev.message);
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          lines.forEach(handle);
        }
        handle(buf);
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

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    convertMessage,
    onNew,
    onReload,
    onCancel,
  });
  return { runtime, messages };
}

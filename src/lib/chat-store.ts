// Reactive localStorage-backed store for Aria conversations.
// One conversation = one thread, identified by a route param.

export type ChatRole = "user" | "assistant";

export interface ActivityStep {
  id: string;
  label: string;
  status: "running" | "done" | "error";
  agent?: string;
  detail?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  reasoning?: string;
  steps?: ActivityStep[];
  agentName?: string;
  agentEmoji?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = "aria.threads.v1";

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let threads: ChatThread[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function persist() {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function hydrate() {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatThread[];
      if (Array.isArray(parsed)) {
        threads = parsed
          .filter((t) => t && typeof t.id === "string")
          .map((t) => ({ ...t, messages: Array.isArray(t.messages) ? t.messages : [] }));
      }
    }
  } catch {
    threads = [];
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThreadsSnapshot(): ChatThread[] {
  hydrate();
  return threads;
}

const EMPTY: ChatThread[] = [];
export function getServerSnapshot(): ChatThread[] {
  return EMPTY;
}

export function getThread(id: string): ChatThread | undefined {
  hydrate();
  return threads.find((t) => t.id === id);
}

export function createThread(id: string = genId()): ChatThread {
  hydrate();
  const now = Date.now();
  const thread: ChatThread = {
    id,
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  threads = [thread, ...threads];
  persist();
  emit();
  return thread;
}

/** Ensure a thread exists for the given id, creating it if missing. */
export function ensureThread(id: string): ChatThread {
  return getThread(id) ?? createThread(id);
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 48 ? `${text.slice(0, 48)}…` : text || "New conversation";
}

/** Replace a thread's messages and refresh its metadata. */
export function setThreadMessages(id: string, messages: ChatMessage[]) {
  hydrate();
  const idx = threads.findIndex((t) => t.id === id);
  const now = Date.now();
  if (idx === -1) {
    threads = [
      {
        id,
        title: deriveTitle(messages),
        createdAt: now,
        updatedAt: now,
        messages,
      },
      ...threads,
    ];
  } else {
    const existing = threads[idx];
    const updated: ChatThread = {
      ...existing,
      messages,
      title: existing.title === "New conversation" ? deriveTitle(messages) : deriveTitle(messages),
      updatedAt: now,
    };
    threads = [updated, ...threads.filter((t) => t.id !== id)];
  }
  persist();
  emit();
}

export function renameThread(id: string, title: string) {
  hydrate();
  threads = threads.map((t) => (t.id === id ? { ...t, title: title || t.title } : t));
  persist();
  emit();
}

export function deleteThread(id: string) {
  hydrate();
  threads = threads.filter((t) => t.id !== id);
  persist();
  emit();
}

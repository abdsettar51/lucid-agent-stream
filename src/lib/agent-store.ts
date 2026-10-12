// localStorage-backed store for assistant personas ("agents") and chat mode.
import { useSyncExternalStore } from "react";

export type ThinkingDepth = "low" | "medium" | "high";
export type ChatMode = "single" | "team";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  personality: string; // free-form "mindset" description
  depth: ThinkingDepth;
}

export const PERSONALITY_PRESETS: { label: string; text: string }[] = [
  {
    label: "صديق مقرّب",
    text: "صديق دافئ ومرح وصادق. يتكلم بعفوية، يهتم بمشاعر المستخدم، يشجعه ويقدّم نصائح عملية بلطف.",
  },
  {
    label: "خبير دقيق",
    text: "خبير تحليلي دقيق. يفكر خطوة بخطوة، يستشهد بالحقائق، ويقدم إجابات منظمة ومباشرة دون حشو.",
  },
  {
    label: "مبدع",
    text: "عقل إبداعي متحمس. يقترح أفكاراً غير تقليدية، يستخدم التشبيهات والقصص، ويحب العصف الذهني.",
  },
  {
    label: "مدرّب تحفيزي",
    text: "مدرّب حازم ومحفّز. يضع خططاً واضحة، يسأل أسئلة تدفع للتفكير، ويتابع الأهداف بجدية.",
  },
];

export const EMOJIS = ["✨", "🤖", "🧠", "🦊", "🌙", "🔥", "🎨", "💼", "🧭", "🌿", "⚡", "🐉"];

interface State {
  agents: Agent[];
  activeId: string;
  mode: ChatMode;
}

const KEY = "aria.agents.v1";

const DEFAULT_AGENT: Agent = {
  id: "aria",
  name: "Aria",
  emoji: "✨",
  personality: PERSONALITY_PRESETS[0].text,
  depth: "medium",
};

let state: State = { agents: [DEFAULT_AGENT], activeId: DEFAULT_AGENT.id, mode: "single" };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as State;
      if (Array.isArray(p.agents) && p.agents.length) state = { ...state, ...p };
    }
  } catch {
    /* ignore */
  }
}

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getAgentState(): State {
  hydrate();
  return state;
}

export function getActiveAgent(): Agent {
  const s = getAgentState();
  return s.agents.find((a) => a.id === s.activeId) ?? s.agents[0];
}

export function useAgentState(): State {
  return useSyncExternalStore(subscribe, getAgentState, getAgentState);
}

export function saveAgent(agent: Agent) {
  const s = getAgentState();
  const exists = s.agents.some((a) => a.id === agent.id);
  commit({
    ...s,
    agents: exists ? s.agents.map((a) => (a.id === agent.id ? agent : a)) : [...s.agents, agent],
    activeId: agent.id,
  });
}

export function deleteAgent(id: string) {
  const s = getAgentState();
  if (s.agents.length <= 1) return;
  const agents = s.agents.filter((a) => a.id !== id);
  commit({ ...s, agents, activeId: s.activeId === id ? agents[0].id : s.activeId });
}

export function setActiveAgent(id: string) {
  commit({ ...getAgentState(), activeId: id });
}

export function setMode(mode: ChatMode) {
  commit({ ...getAgentState(), mode });
}

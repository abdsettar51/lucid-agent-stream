import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL } from "@/lib/ai-gateway.server";

type IncomingMessage = { role: "user" | "assistant"; content: string };
type Persona = { name?: string; personality?: string; depth?: "low" | "medium" | "high" };
type ChatRequestBody = { messages?: IncomingMessage[]; agent?: Persona; mode?: "single" | "team" };

type Step = { id: string; label: string; status: "running" | "done" | "error"; agent?: string; detail?: string };
type Event =
  | { type: "step"; step: Step }
  | { type: "reasoning"; delta: string }
  | { type: "text"; delta: string }
  | { type: "error"; message: string };

function personaPrompt(p: Persona) {
  const name = (p.name || "Aria").slice(0, 60);
  const personality = (p.personality || "").slice(0, 2000);
  return `You are ${name}, the user's personal AI friend and assistant.
Your personality and mindset (follow it closely):
${personality || "Warm, thoughtful and helpful."}

Rules:
- Always reply in the same language the user writes in.
- Use Markdown (headings, lists, tables) when it helps. Code must use fenced blocks with a language tag.
- Stay in character as ${name}.`;
}

function errorMessage(err: unknown): string {
  const e = err as { statusCode?: number; message?: string };
  if (e?.statusCode === 429) return "تم تجاوز حد الطلبات مؤقتاً، حاول بعد قليل.";
  if (e?.statusCode === 402) return "نفد رصيد الذكاء الاصطناعي في مساحة العمل.";
  return e?.message || "حدث خطأ أثناء توليد الرد.";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const persona = body.agent ?? {};
        const depth = persona.depth ?? "medium";
        const system = personaPrompt(persona);
        const modelMessages: ModelMessage[] = messages
          .filter((m) => typeof m.content === "string" && m.content.length > 0)
          .map((m) => ({ role: m.role, content: m.content }) as ModelMessage);

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway(DEFAULT_CHAT_MODEL);
        const signal = request.signal;
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (e: Event) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
            const step = (s: Step) => send({ type: "step", step: s });

            // Streams a final answer, forwarding reasoning + text.
            const runFinal = async (sys: string, msgs: ModelMessage[], writeId: string, writeLabel: string) => {
              const result = streamText({
                model,
                system: sys,
                messages: msgs,
                abortSignal: signal,
                maxRetries: 0,
                providerOptions: { lovable: { reasoningEffort: depth } },
              });
              let started = false;
              for await (const part of result.fullStream) {
                if (part.type === "reasoning-delta") send({ type: "reasoning", delta: part.delta });
                else if (part.type === "text-delta") {
                  if (!started) {
                    started = true;
                    step({ id: writeId, label: writeLabel, status: "running" });
                  }
                  send({ type: "text", delta: part.text });
                } else if (part.type === "error") throw part.error;
              }
              step({ id: writeId, label: writeLabel, status: "done" });
            };

            try {
              if (body.mode === "team") {
                step({ id: "plan", label: "يحلل الطلب ويوزّع المهام على الفريق", status: "running" });
                const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
                const planner = streamText({
                  model,
                  maxRetries: 0,
                  abortSignal: signal,
                  system:
                    'You are a team lead. Split the user request into 2-3 specialist sub-tasks. Respond ONLY with JSON: {"specialists":[{"name":"short role name in the user\'s language","task":"specific sub-task"}]}',
                  messages: modelMessages,
                });
                const planText = await planner.text;
                let specialists: { name: string; task: string }[] = [];
                try {
                  const match = planText.match(/\{[\s\S]*\}/);
                  specialists = (JSON.parse(match?.[0] ?? "{}").specialists ?? []).slice(0, 3);
                } catch {
                  /* fall through */
                }
                if (!specialists.length) specialists = [{ name: "باحث", task: lastUser }];
                step({
                  id: "plan",
                  label: "يحلل الطلب ويوزّع المهام على الفريق",
                  status: "done",
                  detail: specialists.map((s) => `• ${s.name}: ${s.task}`).join("\n"),
                });

                const outputs = await Promise.all(
                  specialists.map(async (s, i) => {
                    const id = `agent-${i}`;
                    step({ id, label: s.task, agent: s.name, status: "running" });
                    try {
                      const r = streamText({
                        model,
                        maxRetries: 0,
                        abortSignal: signal,
                        system: `You are the "${s.name}" specialist on a team. Complete only your sub-task thoroughly and concisely. Reply in the user's language.`,
                        messages: [
                          ...modelMessages,
                          { role: "user", content: `Your sub-task: ${s.task}` } as ModelMessage,
                        ],
                      });
                      const text = await r.text;
                      step({ id, label: s.task, agent: s.name, status: "done", detail: text.slice(0, 280) });
                      return `### ${s.name}\n${text}`;
                    } catch (err) {
                      step({ id, label: s.task, agent: s.name, status: "error", detail: errorMessage(err) });
                      return "";
                    }
                  }),
                );

                await runFinal(
                  `${system}\n\nYour team of specialists produced the notes below. Merge them into one excellent, well-structured final answer for the user. Do not mention internal notes unless helpful.\n\n${outputs.join("\n\n")}`,
                  modelMessages,
                  "write",
                  "يجمع نتائج الفريق ويكتب الرد النهائي",
                );
              } else {
                step({ id: "think", label: "يفكر في طلبك", status: "running" });
                const thinkDone = () => step({ id: "think", label: "يفكر في طلبك", status: "done" });
                // mark thinking done right before writing begins
                const origSend = send;
                let thoughtClosed = false;
                const result = streamText({
                  model,
                  system,
                  messages: modelMessages,
                  abortSignal: signal,
                  maxRetries: 0,
                  providerOptions: { lovable: { reasoningEffort: depth } },
                });
                for await (const part of result.fullStream) {
                  if (part.type === "reasoning-delta") origSend({ type: "reasoning", delta: part.delta });
                  else if (part.type === "text-delta") {
                    if (!thoughtClosed) {
                      thoughtClosed = true;
                      thinkDone();
                      step({ id: "write", label: "يكتب الرد", status: "running" });
                    }
                    origSend({ type: "text", delta: part.text });
                  } else if (part.type === "error") throw part.error;
                }
                if (!thoughtClosed) thinkDone();
                step({ id: "write", label: "يكتب الرد", status: "done" });
              }
            } catch (err) {
              if (!signal.aborted) {
                console.error("[/api/chat]", err);
                send({ type: "error", message: errorMessage(err) });
              }
            } finally {
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});

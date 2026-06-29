import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL } from "@/lib/ai-gateway.server";

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };
type ChatRequestBody = { messages?: IncomingMessage[] };

const SYSTEM_PROMPT = `You are Aria, a thoughtful, articulate AI assistant.
- Be clear, warm, and concise. Get to the point but stay friendly.
- Use Markdown: headings, bold, bullet/numbered lists, tables, and blockquotes where they help.
- For any code, ALWAYS use fenced code blocks with the correct language tag (e.g. \`\`\`ts).
- Prefer well-structured answers over walls of text.`;

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
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const modelMessages: ModelMessage[] = messages
          .filter((m) => typeof m.content === "string" && m.content.length > 0)
          .map((m) => ({ role: m.role, content: m.content }) as ModelMessage);

        const gateway = createLovableAiGatewayProvider(apiKey);

        try {
          const result = streamText({
            model: gateway(DEFAULT_CHAT_MODEL),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
          });

          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-cache, no-transform" },
          });
        } catch (error) {
          console.error("[/api/chat] streamText failed", error);
          return new Response("Failed to generate a response", { status: 502 });
        }
      },
    },
  },
});

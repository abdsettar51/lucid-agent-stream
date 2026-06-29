import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Lovable AI Gateway provider (OpenAI-compatible).
 * Reads the gateway key at call time so it is never bundled to the client.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
  });
}

export const DEFAULT_CHAT_MODEL = "google/gemini-3-flash-preview";

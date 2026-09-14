import { setTimeout as delay } from "node:timers/promises";
import {
  AI_ENDPOINTS,
  AI_KEY_NAMES,
  AI_LIMITS as L,
  AI_PROVIDERS,
  AI_RETRY_STATUSES,
  ANTHROPIC_API_VERSION,
} from "./ai.constants.js";
import { INTERPRETATION_JSON_SCHEMA } from "./contract.js";
export type ProviderName = (typeof AI_PROVIDERS)[number];
export interface ProviderConfig {
  provider: ProviderName;
  model: string;
  apiKey: string;
}
export interface Prompt {
  system: string;
  user: string;
}
export interface AIProvider {
  generate(prompt: Prompt): Promise<unknown>;
}
export function providerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ProviderConfig {
  const provider = env.AI_PROVIDER;
  if (!AI_PROVIDERS.includes(provider as ProviderName))
    throw new Error("AI_PROVIDER must be openai, gemini, or claude");
  const name = provider as ProviderName;
  const apiKey = env[AI_KEY_NAMES[name]]?.trim();
  const model = env.AI_MODEL?.trim();
  if (!apiKey || !model || !/^[a-zA-Z0-9._:-]{1,120}$/.test(model))
    throw new Error("AI model and provider API key must be configured");
  return { provider: name, model, apiKey };
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid AI provider response");
  return value as Record<string, unknown>;
}
function texts(value: unknown, type: string): string {
  if (!Array.isArray(value)) throw new Error("AI text response missing");
  const items = value.map(record);
  if (items.some((item) => item.type === "refusal"))
    throw new Error("AI provider refused the request");
  const output = items
    .filter((item) => item.type === type && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
  if (!output) throw new Error("AI text response missing");
  return output;
}
function extract(provider: ProviderName, body: unknown): unknown {
  const value = record(body);
  let output: string;
  if (provider === "openai") {
    if (value.status !== "completed" || !Array.isArray(value.output))
      throw new Error("AI response did not complete");
    output = texts(
      value.output
        .map(record)
        .filter((item) => item.type === "message")
        .flatMap((item): unknown[] =>
          Array.isArray(item.content) ? (item.content as unknown[]) : [],
        ),
      "output_text",
    );
  } else if (provider === "claude") {
    if (value.stop_reason !== "end_turn")
      throw new Error("AI response did not complete");
    output = texts(value.content, "text");
  } else {
    if (!Array.isArray(value.candidates) || value.candidates.length !== 1)
      throw new Error("AI candidate missing");
    const candidate = record(value.candidates[0]);
    if (candidate.finishReason !== "STOP")
      throw new Error("AI response did not complete");
    const parts = record(candidate.content).parts;
    if (!Array.isArray(parts)) throw new Error("AI text response missing");
    output = parts
      .map(record)
      .filter((part) => part.thought !== true && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }
  try {
    return JSON.parse(output) as unknown;
  } catch {
    throw new Error("AI response was not JSON");
  }
}
async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("AI response body missing");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > L.responseBytes)
        throw new Error("AI response exceeds size limit");
      chunks.push(chunk.value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    } catch {
      throw new Error("AI provider response was not JSON");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export class NativeAIProvider implements AIProvider {
  constructor(
    private readonly config: ProviderConfig,
    private readonly transport: typeof fetch = fetch,
  ) {}
  async generate(prompt: Prompt): Promise<unknown> {
    const { provider, model, apiKey } = this.config;
    let url: string;
    let body: Record<string, unknown>;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (provider === "openai") {
      url = AI_ENDPOINTS.openai;
      headers.Authorization = `Bearer ${apiKey}`;
      body = {
        model,
        store: false,
        max_output_tokens: L.maxOutputTokens,
        instructions: prompt.system,
        input: [{ role: "user", content: prompt.user }],
        text: {
          format: {
            type: "json_schema",
            name: "career_interpretation",
            strict: true,
            schema: INTERPRETATION_JSON_SCHEMA,
          },
        },
      };
    } else if (provider === "claude") {
      url = AI_ENDPOINTS.claude;
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = ANTHROPIC_API_VERSION;
      body = {
        model,
        max_tokens: L.maxOutputTokens,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
        output_config: {
          format: { type: "json_schema", schema: INTERPRETATION_JSON_SCHEMA },
        },
      };
    } else {
      url = `${AI_ENDPOINTS.gemini}${encodeURIComponent(model)}:generateContent`;
      headers["x-goog-api-key"] = apiKey;
      body = {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: {
          maxOutputTokens: L.maxOutputTokens,
          responseFormat: {
            text: {
              mimeType: "application/json",
              schema: INTERPRETATION_JSON_SCHEMA,
            },
          },
        },
      };
    }
    for (let attempt = 0; attempt < L.attempts; attempt++) {
      let response: Response;
      try {
        response = await this.transport(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          redirect: "error",
          signal: AbortSignal.timeout(L.timeoutMs),
        });
      } catch {
        if (attempt + 1 === L.attempts)
          throw new Error("AI provider network request failed");
        await delay(L.retryDelayMs * (attempt + 1));
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        if (
          AI_RETRY_STATUSES.some((status) => status === response.status) &&
          attempt + 1 < L.attempts
        ) {
          await delay(L.retryDelayMs * (attempt + 1));
          continue;
        }
        // Never propagate a provider body: it can contain prompts or credentials.
        throw new Error(`AI provider request failed (${response.status})`);
      }
      return extract(provider, await boundedJson(response));
    }
    throw new Error("AI provider retries exhausted");
  }
}

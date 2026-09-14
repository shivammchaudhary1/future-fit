import { createHash } from "node:crypto";
import { AI_PROMPT_VERSION, AI_SCHEMA_VERSION } from "./ai.constants.js";
import {
  safeProfile,
  validateInterpretation,
  type InterpretationInput,
  type Interpretation,
} from "./contract.js";
import { buildPrompt } from "./prompts.js";
import {
  NativeAIProvider,
  providerConfig,
  type AIProvider,
} from "./provider.js";
export interface AIProvenance {
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  inputHash: string;
  generatedAt: string;
}
export interface InterpretationRecord {
  interpretation: Interpretation;
  provenance: AIProvenance;
}
export async function generateInterpretation(
  input: InterpretationInput,
  options: {
    env?: NodeJS.ProcessEnv;
    provider?: AIProvider;
    cached?: { interpretation?: unknown; provenance?: Partial<AIProvenance> };
  } = {},
): Promise<InterpretationRecord> {
  const env = options.env ?? process.env;
  const config = providerConfig(env);
  const profile = safeProfile(input);
  const promptVersion = env.AI_PROMPT_VERSION ?? AI_PROMPT_VERSION;
  const prompt = buildPrompt(profile, promptVersion);
  const inputHash = createHash("sha256")
    .update(
      JSON.stringify({
        profile,
        system: prompt.system,
        schemaVersion: AI_SCHEMA_VERSION,
      }),
    )
    .digest("hex");
  const expected = {
    provider: config.provider,
    model: config.model,
    promptVersion,
    schemaVersion: AI_SCHEMA_VERSION,
    inputHash,
  };
  const cached = options.cached;
  if (
    cached?.provenance &&
    Object.entries(expected).every(
      ([key, value]) =>
        cached.provenance?.[key as keyof AIProvenance] === value,
    ) &&
    cached.provenance.generatedAt
  ) {
    try {
      return {
        interpretation: validateInterpretation(cached.interpretation, profile),
        provenance: { ...expected, generatedAt: cached.provenance.generatedAt },
      };
    } catch {
      /* Legacy or invalid cached output must be regenerated. */
    }
  }
  const raw = await (options.provider ?? new NativeAIProvider(config)).generate(
    prompt,
  );
  return {
    interpretation: validateInterpretation(raw, profile),
    provenance: { ...expected, generatedAt: new Date().toISOString() },
  };
}

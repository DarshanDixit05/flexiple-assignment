import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// gemini-3.6-flash's free tier is capped at 20 requests/DAY per project
// (GenerateRequestsPerDayPerProjectPerModel-FreeTier) — discovered by hitting
// it during testing. Completely impractical for an app making 2-3 LLM calls
// per search round. gemini-flash-lite-latest has a much higher free-tier
// daily quota and produced equally valid structured output in testing.
const MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 28000;

export class LlmTimeoutError extends Error {
  constructor() {
    super("LLM request timed out");
    this.name = "LlmTimeoutError";
  }
}

export class LlmRateLimitError extends Error {
  constructor(message = "LLM rate limit exceeded") {
    super(message);
    this.name = "LlmRateLimitError";
  }
}

export class LlmUnavailableError extends Error {
  constructor(message = "LLM is temporarily unavailable") {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

export class LlmValidationError extends Error {
  constructor(
    message: string,
    public raw: unknown,
  ) {
    super(message);
    this.name = "LlmValidationError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

const ALLOWED_SCHEMA_KEYS = new Set([
  "type",
  "properties",
  "items",
  "enum",
  "required",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "minItems",
  "maxItems",
  "additionalProperties",
  "nullable",
  "description",
]);

/**
 * Converts a Zod schema to a JSON schema Gemini's structured-output mode will
 * accept. Gemini's schema dialect predates full JSON-Schema-draft support and
 * rejects `type: [X, "null"]` unions (used by z.nullable()) and unknown
 * keywords like `default` — this rewrites nullable unions to `nullable: true`
 * and strips anything outside the accepted keyword set, recursively.
 */
function toGeminiJsonSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete json.$schema;
  return sanitize(json);
}

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (node === null || typeof node !== "object") return node;

  const obj = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  const type = obj.type;
  if (Array.isArray(type) && type.includes("null")) {
    const rest = type.filter((t) => t !== "null");
    out.type = rest.length === 1 ? rest[0] : rest;
    out.nullable = true;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === "type" && out.type !== undefined) continue;
    if (!ALLOWED_SCHEMA_KEYS.has(key)) continue;

    // "properties" is a dict keyed by field name (e.g. "skills"), not by
    // schema keyword — recurse into each field's schema without filtering
    // the field names themselves against ALLOWED_SCHEMA_KEYS.
    if (key === "properties" && value && typeof value === "object") {
      const props: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(value as Record<string, unknown>)) {
        props[propName] = sanitize(propSchema);
      }
      out.properties = props;
      continue;
    }

    out[key] = sanitize(value);
  }

  return out;
}

function statusOf(err: unknown): number | undefined {
  return typeof err === "object" && err !== null && "status" in err
    ? (err as { status?: unknown }).status as number | undefined
    : undefined;
}

function isRateLimitError(err: unknown): boolean {
  if (statusOf(err) === 429) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.?limit/i.test(msg);
}

// The free-tier Gemini API returns these under normal, expected load — Google's
// own error message says "temporary, try again later." Worth a couple of quick
// automatic retries before bothering the recruiter with an error state.
function isTransientError(err: unknown): boolean {
  const status = statusOf(err);
  if (status === 503 || status === 500 || status === 429) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /UNAVAILABLE|overloaded/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TRANSIENT_RETRY_DELAYS_MS = [800, 1800];

async function callOnce(
  systemInstruction: string,
  prompt: string,
  jsonSchema: unknown,
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const ai = getClient();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          temperature: 0.4,
          abortSignal: controller.signal,
        },
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from model");
      return text;
    } catch (err) {
      if (controller.signal.aborted) throw new LlmTimeoutError();

      const delay = TRANSIENT_RETRY_DELAYS_MS[attempt];
      if (isTransientError(err) && delay !== undefined) {
        await sleep(delay);
        continue;
      }
      if (isRateLimitError(err)) throw new LlmRateLimitError();
      if (isTransientError(err)) throw new LlmUnavailableError();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Calls Gemini with a JSON-schema-constrained prompt, parses, and validates
 * against the given Zod schema. Retries once with a repair instruction if
 * validation fails (constrained JSON mode still occasionally drifts on
 * enums/ranges), then surfaces a typed error rather than throwing raw.
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  opts: { systemInstruction: string; prompt: string },
): Promise<T> {
  const jsonSchema = toGeminiJsonSchema(schema);
  let lastRaw: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? opts.prompt
        : `${opts.prompt}\n\nYour previous response failed validation with this error:\n${lastError}\n\nYour previous response was:\n${lastRaw}\n\nFix it and return ONLY valid JSON matching the schema.`;

    const text = await callOnce(opts.systemInstruction, prompt, jsonSchema);
    lastRaw = text;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      lastError = "Response was not valid JSON.";
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    lastError = result.error.message;
  }

  throw new LlmValidationError(
    `Model output failed schema validation after retry: ${lastError}`,
    lastRaw,
  );
}

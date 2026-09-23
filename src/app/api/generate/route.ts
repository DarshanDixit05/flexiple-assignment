import { NextResponse } from "next/server";
import { badRequest, errorResponse } from "@/lib/apiError";
import { generateStructured } from "@/lib/llm";
import { buildGeneratePrompt, GENERATE_SYSTEM_INSTRUCTION } from "@/prompts/generate";
import { GenerateResultSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const query = (body as { query?: unknown })?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return badRequest("`query` is required and must be a non-empty string.");
  }

  try {
    const result = await generateStructured(GenerateResultSchema, {
      systemInstruction: GENERATE_SYSTEM_INSTRUCTION,
      prompt: buildGeneratePrompt(query.trim()),
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

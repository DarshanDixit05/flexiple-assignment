import { z } from "zod";
import { NextResponse } from "next/server";
import { badRequest, errorResponse } from "@/lib/apiError";
import { generateStructured } from "@/lib/llm";
import {
  FiltersSchema,
  RefineResultSchema,
  RubricSchema,
  ScoredProfileInputSchema,
} from "@/lib/schemas";
import { buildRefinePrompt, REFINE_SYSTEM_INSTRUCTION } from "@/prompts/refine";

const RequestSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
  shownResults: z.array(ScoredProfileInputSchema),
  feedback: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(`Invalid request: ${parsed.error.message}`);
  }
  const { filters, rubric, shownResults, feedback } = parsed.data;

  try {
    const result = await generateStructured(RefineResultSchema, {
      systemInstruction: REFINE_SYSTEM_INSTRUCTION,
      prompt: buildRefinePrompt(filters, rubric, shownResults, feedback),
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

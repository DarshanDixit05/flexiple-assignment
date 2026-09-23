import { NextResponse } from "next/server";
import { badRequest, errorResponse } from "@/lib/apiError";
import { applyFilters } from "@/lib/filterEngine";
import { generateStructured } from "@/lib/llm";
import { getProfiles } from "@/lib/profiles";
import { FiltersSchema, RubricSchema, ScoreResultSchema } from "@/lib/schemas";
import { buildScorePrompt, SCORE_SYSTEM_INSTRUCTION } from "@/prompts/score";
import type { ScoredProfile } from "@/lib/types";

const TOP_N = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const filtersParsed = FiltersSchema.safeParse((body as { filters?: unknown })?.filters);
  const rubricParsed = RubricSchema.safeParse((body as { rubric?: unknown })?.rubric);
  if (!filtersParsed.success) return badRequest("`filters` is invalid.");
  if (!rubricParsed.success) return badRequest("`rubric` is invalid.");

  const filters = filtersParsed.data;
  const rubric = rubricParsed.data;

  const allProfiles = getProfiles();
  const matched = applyFilters(allProfiles, filters);

  if (matched.length === 0) {
    return NextResponse.json({ results: [], matchedCount: 0 });
  }

  try {
    const { scores } = await generateStructured(ScoreResultSchema, {
      systemInstruction: SCORE_SYSTEM_INSTRUCTION,
      prompt: buildScorePrompt(rubric, matched),
    });

    const scoreById = new Map(scores.map((s) => [s.id, s]));
    const results: ScoredProfile[] = matched
      .map((profile) => {
        const s = scoreById.get(profile.id);
        return s
          ? { profile, score: s.score, explanation: s.explanation }
          : { profile, score: 0, explanation: "The model did not return a score for this profile." };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    return NextResponse.json({ results, matchedCount: matched.length });
  } catch (err) {
    return errorResponse(err);
  }
}

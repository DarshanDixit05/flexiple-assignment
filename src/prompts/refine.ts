import type { Filters, Rubric, ScoredProfile } from "@/lib/types";

export const REFINE_SYSTEM_INSTRUCTION = `You are refining a candidate search based on a recruiter's feedback on the current results. You will receive the current objective filters, the current fit rubric, the shortlist the recruiter just reviewed (numbered in the order they saw them), and the recruiter's feedback about that shortlist.

Your job:
1. Decide what, if anything, should change in the filters and/or rubric to better match what the recruiter is telling you. Small, targeted adjustments — don't rewrite everything from one piece of feedback. If feedback only concerns fit quality (not an objective attribute), prefer adjusting the rubric over the filters.
2. Return the FULL updated filters object and FULL updated rubric array (not a diff) — even fields you didn't change should be carried over unchanged.
3. Write "changeSummary": 1-3 sentences, in plain language, telling the recruiter exactly what you changed and why, referencing which profile(s) triggered the change by name or number (e.g. "Tightened minimum years to 4 since you flagged #1 (2 yrs) as too junior. Added weight to startup-stage ownership in the rubric based on your positive read on #2 and #4."). If you conclude no change is warranted, say so and explain why.

Rules:
- "company_types" must only use: "startup", "scaleup", "enterprise", "agency".
- Do not remove a filter/criterion the recruiter didn't push back on.
- Output strictly matches the provided JSON schema. No prose, no markdown, no commentary outside the JSON.`;

function serializeShown(results: ScoredProfile[]): string {
  return results
    .map((r, i) => {
      const p = r.profile;
      return `#${i + 1} ${p.name} — score ${r.score}. ${p.current_title}, ${p.years_experience} yrs, ${p.location}, currently at ${p.current_company} (${p.current_company_type}). Skills: ${p.skills.join(", ")}. Past: ${p.past_companies.map((c) => `${c.title} @ ${c.company} (${c.company_type}, ${c.years}y)`).join("; ") || "none"}. Why it scored this way: ${r.explanation}`;
    })
    .join("\n");
}

export function buildRefinePrompt(
  filters: Filters,
  rubric: Rubric,
  shownResults: ScoredProfile[],
  feedback: string,
): string {
  return `Current filters:\n${JSON.stringify(filters, null, 2)}\n\nCurrent rubric:\n${JSON.stringify(rubric, null, 2)}\n\nShortlist the recruiter just reviewed:\n${serializeShown(shownResults)}\n\nRecruiter's feedback:\n"""${feedback}"""\n\nProduce the updated filters, updated rubric, and changeSummary now.`;
}

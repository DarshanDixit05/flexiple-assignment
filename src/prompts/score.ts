import type { Profile, Rubric } from "@/lib/types";

export const SCORE_SYSTEM_INSTRUCTION = `You are scoring candidate profiles against a recruiter's fit rubric. You will receive the rubric (weighted criteria describing what "good" looks like) and a list of candidate profiles that have already passed the objective filters.

For each profile, produce:
- "id": the profile's id, unchanged.
- "score": 0-100, how well this profile fits the rubric overall (weight your judgment per-criterion by the given weights).
- "explanation": 1-3 sentences, specific to THIS profile. You MUST reference real, verbatim details from the profile's own fields (their actual skills, years_experience, current_company, past_companies, summary, etc.) as evidence. Never write generic praise ("strong candidate", "good fit") without tying it to a specific fact from their record. If a profile is weak on a criterion, say so and cite why (e.g. "only 2 years at Cognizant, an enterprise, not the startup depth the rubric wants").

Score every profile you're given, even weak ones — do not omit any. Rank is derived from score, so be honest and differentiated; don't cluster everyone at 70-80.

Output strictly matches the provided JSON schema. No prose, no markdown, no commentary outside the JSON.`;

function serializeProfile(p: Profile): string {
  return JSON.stringify({
    id: p.id,
    name: p.name,
    current_title: p.current_title,
    years_experience: p.years_experience,
    location: p.location,
    current_company: p.current_company,
    current_company_type: p.current_company_type,
    skills: p.skills,
    past_companies: p.past_companies,
    education: p.education,
    summary: p.summary,
  });
}

export function buildScorePrompt(rubric: Rubric, profiles: Profile[]): string {
  const rubricText = rubric
    .map((r) => `- ${r.criterion} (weight ${r.weight}): ${r.description}`)
    .join("\n");
  const profilesText = profiles.map(serializeProfile).join("\n");

  return `Fit rubric:\n${rubricText}\n\nCandidate profiles (one JSON object per line):\n${profilesText}\n\nScore all ${profiles.length} profiles now.`;
}

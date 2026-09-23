import type { Filters, Profile } from "./types";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function matchesSkills(profile: Profile, skills: string[]): boolean {
  if (skills.length === 0) return true;
  const profileSkills = new Set(profile.skills.map(norm));
  // Only checks "candidate's skill contains the search term" (e.g. profile skill
  // "PostgreSQL" matches search "Postgres"), never the reverse — matching the other
  // way ("AWS".includes-able-in search "AWS RDS") would let a candidate whose only
  // relevant skill is the generic "AWS" falsely match a specific "AWS RDS" search.
  return skills.some((skill) => {
    const s = norm(skill);
    return [...profileSkills].some((ps) => ps.includes(s));
  });
}

function matchesYears(
  profile: Profile,
  min: number | null,
  max: number | null,
): boolean {
  if (min !== null && profile.years_experience < min) return false;
  if (max !== null && profile.years_experience > max) return false;
  return true;
}

function matchesLocation(profile: Profile, locations: string[]): boolean {
  if (locations.length === 0) return true;
  const loc = norm(profile.location);
  // Same one-directional rule as matchesSkills: the candidate's location must
  // contain the search term (e.g. "Delhi NCR" matches a search for "Delhi"),
  // not the reverse — which would let an unrelated place falsely match just
  // because a short candidate location happened to be a substring of it.
  return locations.some((l) => loc.includes(norm(l)));
}

function matchesCompanyType(profile: Profile, types: string[]): boolean {
  if (types.length === 0) return true;
  return types.includes(profile.current_company_type);
}

function matchesKeywords(profile: Profile, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = norm(
    [
      profile.current_title,
      profile.summary,
      profile.current_company,
      profile.education,
      ...profile.skills,
      ...profile.past_companies.map((c) => `${c.company} ${c.title}`),
    ].join(" "),
  );
  return keywords.some((k) => haystack.includes(norm(k)));
}

/** Pure, deterministic filter — no LLM involved. */
export function applyFilters(profiles: Profile[], filters: Filters): Profile[] {
  return profiles.filter(
    (p) =>
      matchesSkills(p, filters.skills) &&
      matchesYears(p, filters.min_years_experience, filters.max_years_experience) &&
      matchesLocation(p, filters.locations) &&
      matchesCompanyType(p, filters.company_types) &&
      matchesKeywords(p, filters.keywords),
  );
}

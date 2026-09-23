import type { Filters, Rubric, ScoredProfile } from "./types";
import type { ErrorCode } from "./apiError";

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(json?.error?.code ?? "UNKNOWN", json?.error?.message ?? "Request failed.");
  }
  return json as T;
}

export function generateSearch(query: string) {
  return post<{ filters: Filters; rubric: Rubric }>("/api/generate", { query });
}

export function runSearch(filters: Filters, rubric: Rubric) {
  return post<{ results: ScoredProfile[]; matchedCount: number }>("/api/search", {
    filters,
    rubric,
  });
}

export function refineSearch(
  filters: Filters,
  rubric: Rubric,
  shownResults: ScoredProfile[],
  feedback: string,
) {
  return post<{ filters: Filters; rubric: Rubric; changeSummary: string }>("/api/refine", {
    filters,
    rubric,
    shownResults,
    feedback,
  });
}

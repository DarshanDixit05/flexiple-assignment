# Sourcing Refinement Loop

A recruiter-facing tool that turns a free-text hiring brief into transparent, editable search filters and a fit rubric, scores a candidate pool against them with an LLM, and lets the recruiter refine results through natural-language feedback — with every change explained, not just re-rolled.

Full design rationale lives in [PLAN.md](./PLAN.md); build-by-build notes (including bugs found during real-API smoke testing) are in [CHECKPOINTS.md](./CHECKPOINTS.md).

## Setup

**Requirements:** Node 20+, a free [Google Gemini API key](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local   # then paste your key into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No database, no second process, no build step required to try it.

### Environment variable

| Variable | Required | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com/apikey) — free tier is sufficient |

The key is read server-side only (`src/lib/llm.ts`), never sent to the client. `.env.local` is gitignored.

## How it works

1. **Free-text query → filters + rubric.** `POST /api/generate` sends the recruiter's brief to Gemini with a Zod-validated structured-output schema and gets back deterministic search filters (skills, experience range, location, company type, keywords) plus a weighted fit rubric — both editable before anything runs.
2. **Filter locally, score with the LLM.** `POST /api/search` filters the 48-profile pool with a pure, LLM-free TypeScript function (`src/lib/filterEngine.ts`), then sends the filtered set to Gemini in one batched call to score and rank against the rubric. Every explanation is grounded in that profile's actual fields — no generic praise.
3. **Refine by feedback, not by re-rolling.** Chat-style feedback ("3 is too junior, I want someone more senior like 1 and 2") goes to `POST /api/refine`, which returns updated filters/rubric plus a plain-English `changeSummary` explaining what changed and why, then the client re-runs search automatically.
4. **Freeze.** A client-only state transition — no endpoint — that locks editing and renders a clean summary of the final filters, rubric, and shortlist.

```
Client (React, all state in-memory — no server session, no persistence)
   │
   ├── POST /api/generate   query → { filters, rubric }
   ├── POST /api/search     { filters, rubric } → ranked top 5 (local filter + 1 LLM scoring call)
   └── POST /api/refine     { filters, rubric, results, feedback } → { filters, rubric, changeSummary }
```

## Decisions made while building

- **Next.js App Router, one process.** API routes double as the backend, so `npm run dev` is the entire setup — no separate server, no CORS to wire up.
- **Gemini over other free-tier LLM options**, specifically `gemini-flash-lite-latest` — not the more obvious `gemini-3.6-flash`. That model's free tier caps at 20 requests/*day* per project, which a 2-3-call-per-search-round app burns through almost immediately (see CHECKPOINTS.md bug #2). `gemini-flash-lite-latest` has a much higher daily quota and produced equally valid structured output in side-by-side testing. Uses native `responseJsonSchema` structured-output mode so the model is constrained at generation time.
- **Zod validation on every LLM response, even though the schema already constrains it.** Gemini's structured-output mode predates full JSON-Schema support (no `type` unions, no `default`) so responses are still re-parsed and validated server-side before reaching the client; one automatic repair-prompt retry on failure, then a typed error — a bad response never overwrites good state in the client.
- **Filtering is deterministic, scoring is the only LLM step.** `applyFilters()` is a pure function with no model involved, so a recruiter can trust that the filter chips do exactly what they say. The LLM only ranks and explains the profiles that already passed the filter.
- **Stateless server, client-held session.** The whole session (filters, rubric, ~48 scored profiles, chat log) is a few KB of JSON round-tripped on every call. No DB, no session store — matches the spec's "no persistence across sessions" directly, and means a page refresh has honest, predictable behavior.
- **Batched scoring, not one call per candidate.** The filtered set is scored in a single prompt so the model ranks candidates relative to each other rather than in isolation, and so latency/quota stay reasonable.
- **Automatic retry on transient errors (503/overloaded, 429/rate-limited)** with short backoff before surfacing an error to the recruiter — these occurred routinely during real-API testing and are expected free-tier behavior, not exceptional failures. The client-facing error message never leaks raw upstream error bodies.

## What I'd add with more time

- Persisting a session (e.g. via URL or local storage) so a refresh doesn't lose progress — explicitly out of scope for this exercise, but the first thing I'd revisit for a real tool.
- Nudging the refine prompt to lean on the recruiter's *stated reason* rather than inventing one: when feedback is just a bare verdict (e.g. from the 👍/👎 shortcuts with no typed reason), the model can occasionally justify a filter change with a distinction that doesn't actually hold up against the two profiles' real data. It's reliably coherent whenever the recruiter states a reason ("too junior", "wrong stack"), which is the common case.

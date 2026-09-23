"use client";

import { useState } from "react";
import type { ChatTurn, Filters, Phase, Rubric, ScoredProfile } from "@/lib/types";
import { ApiError, generateSearch, refineSearch, runSearch } from "@/lib/api";
import { IdleScreen } from "./IdleScreen";
import { ThinkingScreen } from "./ThinkingScreen";
import { ErrorBanner } from "./ErrorBanner";
import { FiltersPanel } from "./FiltersPanel";
import { RubricPanel } from "./RubricPanel";
import { ResultCard } from "./ResultCard";
import { ChatPanel } from "./ChatPanel";
import { FrozenSummary } from "./FrozenSummary";

const GENERATE_STEPS = [
  "Reading your requirement…",
  "Drafting objective filters…",
  "Writing the fit rubric…",
];
const SEARCH_STEPS = ["Applying filters to the talent pool…", "Scoring candidates against the rubric…"];
const REFINE_STEPS = ["Reading your feedback…", "Adjusting filters and rubric…"];

interface ErrorState {
  message: string;
  retry: () => void;
}

export function SessionApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [thinkingSteps, setThinkingSteps] = useState<string[]>(GENERATE_STEPS);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [results, setResults] = useState<ScoredProfile[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  function describeError(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    return "Something went wrong. Please try again.";
  }

  async function handleSubmitQuery(q: string) {
    setError(null);
    setQuery(q);
    setThinkingSteps(GENERATE_STEPS);
    setPhase("generating");
    try {
      const { filters: f, rubric: r } = await generateSearch(q);
      setFilters(f);
      setRubric(r);
      await runInitialSearch(f, r);
    } catch (err) {
      setError({ message: describeError(err), retry: () => handleSubmitQuery(q) });
      setPhase("idle");
    }
  }

  async function runInitialSearch(f: Filters, r: Rubric) {
    setThinkingSteps(SEARCH_STEPS);
    setPhase("searching");
    try {
      const { results: res, matchedCount: mc } = await runSearch(f, r);
      setResults(res);
      setMatchedCount(mc);
      setPhase("results");
    } catch (err) {
      setError({ message: describeError(err), retry: () => runInitialSearch(f, r) });
      setPhase("results");
    }
  }

  async function handleRerunSearch() {
    if (!filters || !rubric) return;
    setError(null);
    await runInitialSearch(filters, rubric);
  }

  function handleQuickFeedback(index: number, verdict: "good" | "bad") {
    const profile = results[index - 1]?.profile;
    const line = `#${index}${profile ? ` (${profile.name})` : ""} is ${
      verdict === "good" ? "a good match." : "not a good match."
    }`;
    setFeedbackDraft((prev) => (prev ? `${prev} ${line}` : line));
  }

  async function handleSendFeedback() {
    const feedback = feedbackDraft.trim();
    if (!feedback || !filters || !rubric) return;

    setError(null);
    setFeedbackDraft("");
    setChat((prev) => [...prev, { role: "recruiter", message: feedback, timestamp: Date.now() }]);
    setRefining(true);

    try {
      const { filters: newFilters, rubric: newRubric, changeSummary } = await refineSearch(
        filters,
        rubric,
        results,
        feedback,
      );
      setChat((prev) => [
        ...prev,
        { role: "assistant", message: changeSummary, timestamp: Date.now() },
      ]);
      setFilters(newFilters);
      setRubric(newRubric);
      setRefining(false);
      setThinkingSteps(REFINE_STEPS);
      setPhase("searching");
      try {
        const { results: res, matchedCount: mc } = await runSearch(newFilters, newRubric);
        setResults(res);
        setMatchedCount(mc);
        setPhase("results");
      } catch (err) {
        setError({
          message: describeError(err),
          retry: () => runInitialSearch(newFilters, newRubric),
        });
        setPhase("results");
      }
    } catch (err) {
      setRefining(false);
      setChat((prev) => prev.slice(0, -1));
      setFeedbackDraft(feedback);
      setError({ message: describeError(err), retry: handleSendFeedback });
    }
  }

  function handleFreeze() {
    setPhase("frozen");
  }

  function handleStartNew() {
    setPhase("idle");
    setQuery("");
    setFilters(null);
    setRubric(null);
    setResults([]);
    setMatchedCount(0);
    setChat([]);
    setFeedbackDraft("");
    setError(null);
  }

  // `refining` is included here (not just the phase check) because it covers
  // the network gap between sending chat feedback and the phase actually
  // flipping to "searching" — without it, Freeze/Re-run/filter edits were
  // clickable while a refine call was in flight, and a late-resolving refine
  // could silently un-freeze a search the recruiter had already frozen.
  const busy = phase === "generating" || phase === "searching" || refining;

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-slate-100 px-6 py-4">
        <span className="text-sm font-semibold text-slate-900 tracking-tight">
          Sourcing Copilot
        </span>
      </header>

      {phase === "idle" && <IdleScreen onSubmit={handleSubmitQuery} />}

      {(phase === "generating" || (phase === "searching" && results.length === 0)) && (
        <ThinkingScreen key={thinkingSteps[0]} steps={thinkingSteps} />
      )}

      {phase === "frozen" && filters && rubric && (
        <FrozenSummary
          query={query}
          filters={filters}
          rubric={rubric}
          results={results}
          onStartNew={handleStartNew}
        />
      )}

      {(phase === "results" || (phase === "searching" && results.length > 0)) &&
        filters &&
        rubric && (
          <div className="max-w-5xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-4">
            {error && (
              <ErrorBanner
                message={error.message}
                onRetry={() => {
                  const retry = error.retry;
                  setError(null);
                  retry();
                }}
                onDismiss={() => setError(null)}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Search</p>
                <p className="text-slate-900 font-medium">{query}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRerunSearch}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Re-run search
                </button>
                <button
                  onClick={handleFreeze}
                  disabled={busy || results.length === 0}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  Freeze search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 flex-1 min-h-0">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Filters</p>
                  <FiltersPanel filters={filters} onChange={setFilters} editable={!busy} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Fit rubric</p>
                  <RubricPanel rubric={rubric} onChange={setRubric} editable={!busy} />
                </div>
              </div>

              <div className="flex flex-col gap-4 min-h-0">
                {phase === "searching" ? (
                  <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <ThinkingScreen key={thinkingSteps[0]} steps={thinkingSteps} />
                  </div>
                ) : results.length === 0 && error ? null : results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 px-6">
                    <p className="text-slate-700 font-medium">No profiles match these filters.</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm">
                      Try loosening years of experience, locations, or skills in the panel on the
                      left, then re-run the search.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">
                      Showing top {results.length} of {matchedCount} matched profile
                      {matchedCount === 1 ? "" : "s"}
                    </p>
                    <div className="space-y-3">
                      {results.map((r, i) => (
                        <ResultCard
                          key={r.profile.id}
                          index={i + 1}
                          result={r}
                          onQuickFeedback={handleQuickFeedback}
                          disabled={busy}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <ChatPanel
                  chat={chat}
                  draft={feedbackDraft}
                  onDraftChange={setFeedbackDraft}
                  onSend={handleSendFeedback}
                  loading={refining}
                  disabled={busy || results.length === 0}
                />
              </div>
            </div>
          </div>
        )}

      {phase === "idle" && error && (
        <div className="px-6 pb-6 max-w-2xl mx-auto w-full">
          <ErrorBanner
            message={error.message}
            onRetry={() => {
              const retry = error.retry;
              setError(null);
              retry();
            }}
            onDismiss={() => setError(null)}
          />
        </div>
      )}
    </div>
  );
}

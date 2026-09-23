"use client";

import type { Filters, Rubric, ScoredProfile } from "@/lib/types";
import { FiltersPanel } from "./FiltersPanel";
import { RubricPanel } from "./RubricPanel";

interface Props {
  query: string;
  filters: Filters;
  rubric: Rubric;
  results: ScoredProfile[];
  onStartNew: () => void;
}

export function FrozenSummary({ query, filters, rubric, results, onStartNew }: Props) {
  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10 animate-fade-in-up">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium">
          ✓ Search frozen
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{query}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Final shortlist — {results.length} candidate{results.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Frozen filters</p>
          <FiltersPanel filters={filters} onChange={() => {}} editable={false} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Frozen rubric</p>
          <RubricPanel rubric={rubric} onChange={() => {}} editable={false} />
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-900 mb-3">Shortlist</p>
      <div className="space-y-3">
        {results.map((r, i) => (
          <div
            key={r.profile.id}
            className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4"
          >
            <div>
              <p className="font-medium text-slate-900">
                {i + 1}. {r.profile.name}{" "}
                <span className="font-normal text-slate-400">— {r.profile.current_title}</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">{r.explanation}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-900">{r.score}</span>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onStartNew}
          className="text-sm text-slate-400 hover:text-slate-700 underline underline-offset-2"
        >
          Start a new search
        </button>
      </div>
    </div>
  );
}

"use client";

import type { ScoredProfile } from "@/lib/types";

interface Props {
  index: number;
  result: ScoredProfile;
  onQuickFeedback: (index: number, verdict: "good" | "bad") => void;
  disabled: boolean;
}

const scoreColor = (score: number) =>
  score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-slate-400";

export function ResultCard({ index, result, onQuickFeedback, disabled }: Props) {
  const { profile, score, explanation } = result;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
            {index}
          </span>
          <div>
            <p className="font-semibold text-slate-900 leading-snug">{profile.name}</p>
            <p className="text-sm text-slate-500">
              {profile.current_title} · {profile.current_company}{" "}
              <span className="capitalize">({profile.current_company_type})</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.years_experience} yrs · {profile.location}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold text-slate-900">{score}</div>
          <div className="w-16 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
            <div
              className={`h-full ${scoreColor(score)} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{explanation}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="text-xs rounded-full bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
        <span className="text-xs text-slate-400 mr-1">Match?</span>
        <button
          disabled={disabled}
          onClick={() => onQuickFeedback(index, "good")}
          className="rounded-lg px-2 py-1 text-sm hover:bg-emerald-50 disabled:opacity-40"
          aria-label="Good match"
        >
          👍
        </button>
        <button
          disabled={disabled}
          onClick={() => onQuickFeedback(index, "bad")}
          className="rounded-lg px-2 py-1 text-sm hover:bg-red-50 disabled:opacity-40"
          aria-label="Not a match"
        >
          👎
        </button>
      </div>
    </div>
  );
}

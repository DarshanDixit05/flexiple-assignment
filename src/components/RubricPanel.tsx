"use client";

import type { Rubric } from "@/lib/types";

interface Props {
  rubric: Rubric;
  onChange: (rubric: Rubric) => void;
  editable: boolean;
}

export function RubricPanel({ rubric, onChange, editable }: Props) {
  const weightSum = rubric.reduce((s, r) => s + r.weight, 0);

  function update(i: number, patch: Partial<Rubric[number]>) {
    onChange(rubric.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function remove(i: number) {
    onChange(rubric.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...rubric, { criterion: "New criterion", description: "", weight: 0 }]);
  }

  return (
    <div className="space-y-3">
      {rubric.map((r, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5"
        >
          <div className="flex items-start justify-between gap-2">
            {editable ? (
              <textarea
                value={r.criterion}
                onChange={(e) => update(i, { criterion: e.target.value })}
                rows={2}
                className="flex-1 min-w-0 font-medium text-sm text-slate-900 border-none bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-violet-300 rounded px-1 -mx-1 leading-snug"
              />
            ) : (
              <span className="flex-1 min-w-0 font-medium text-sm text-slate-900 leading-snug">
                {r.criterion}
              </span>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {editable ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={r.weight}
                  onChange={(e) => update(i, { weight: Number(e.target.value) })}
                  className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              ) : (
                <span className="text-xs font-medium text-violet-700 bg-violet-50 rounded-full px-2 py-0.5">
                  {r.weight}%
                </span>
              )}
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove criterion"
                  className="text-slate-300 hover:text-red-500 text-sm leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {editable ? (
            <textarea
              value={r.description}
              onChange={(e) => update(i, { description: e.target.value })}
              rows={2}
              className="w-full text-sm text-slate-600 border-none bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-violet-300 rounded px-1 -mx-1"
            />
          ) : (
            <p className="text-sm text-slate-600">{r.description}</p>
          )}
        </div>
      ))}

      {editable && (
        <button
          type="button"
          onClick={add}
          className="text-sm text-violet-700 hover:text-violet-900 font-medium"
        >
          + Add criterion
        </button>
      )}

      {editable && rubric.length > 0 && (
        <p className={`text-xs ${weightSum === 100 ? "text-slate-400" : "text-amber-600"}`}>
          Weights sum to {weightSum}
          {weightSum !== 100 ? " (doesn't need to be exactly 100, but keep it close)" : ""}
        </p>
      )}
    </div>
  );
}

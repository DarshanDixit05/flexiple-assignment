"use client";

import { useState } from "react";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  editable: boolean;
  placeholder?: string;
  emptyLabel?: string;
  tone?: "default" | "accent";
}

export function TagInput({
  label,
  values,
  onChange,
  editable,
  placeholder,
  emptyLabel = "Any",
  tone = "default",
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const chipClass =
    tone === "accent"
      ? "bg-violet-100 text-violet-800 border-violet-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  function commitDraft() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {values.length === 0 && !editable && (
          <span className="text-sm text-slate-400 italic">{emptyLabel}</span>
        )}
        {values.map((v) => (
          <span
            key={v}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${chipClass}`}
          >
            {v}
            {editable && (
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-slate-400 hover:text-slate-700 leading-none"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {editable && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={commitDraft}
            placeholder={placeholder ?? "Add..."}
            className="min-w-[100px] flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none py-1"
          />
        )}
      </div>
    </div>
  );
}

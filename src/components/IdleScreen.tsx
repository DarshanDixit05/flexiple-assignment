"use client";

import { useState } from "react";

const EXAMPLE =
  "RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.";

interface Props {
  onSubmit: (query: string) => void;
}

export function IdleScreen({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const q = value.trim();
    if (q) onSubmit(q);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in-up">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Who are you looking for?
        </h1>
        <p className="mt-2 text-slate-500">
          Describe the role in plain English. We&apos;ll turn it into filters and a fit rubric.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 p-2 flex items-end gap-2">
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={EXAMPLE}
            rows={3}
            className="flex-1 resize-none border-none bg-transparent px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            Search
          </button>
        </div>

        <button
          onClick={() => setValue(EXAMPLE)}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600"
        >
          Try the example query
        </button>
      </div>
    </div>
  );
}

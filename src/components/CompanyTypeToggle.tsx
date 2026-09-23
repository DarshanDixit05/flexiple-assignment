"use client";

import type { CompanyType } from "@/lib/types";

const ALL_TYPES: CompanyType[] = ["startup", "scaleup", "enterprise", "agency"];

interface Props {
  selected: CompanyType[];
  onChange: (types: CompanyType[]) => void;
  editable: boolean;
}

export function CompanyTypeToggle({ selected, onChange, editable }: Props) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
        Company type
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 && !editable && (
          <span className="text-sm text-slate-400 italic">Any</span>
        )}
        {editable
          ? ALL_TYPES.map((t) => {
              const active = selected.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onChange(active ? selected.filter((x) => x !== t) : [...selected, t])
                  }
                  className={`rounded-full border px-2.5 py-1 text-sm capitalize transition-colors ${
                    active
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              );
            })
          : selected.map((t) => (
              <span
                key={t}
                className="rounded-full border px-2.5 py-1 text-sm capitalize bg-slate-100 text-slate-700 border-slate-200"
              >
                {t}
              </span>
            ))}
      </div>
    </div>
  );
}

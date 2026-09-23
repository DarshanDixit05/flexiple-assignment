"use client";

import type { Filters } from "@/lib/types";
import { TagInput } from "./TagInput";
import { CompanyTypeToggle } from "./CompanyTypeToggle";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  editable: boolean;
}

export function FiltersPanel({ filters, onChange, editable }: Props) {
  return (
    <div className="space-y-4">
      <TagInput
        label="Skills"
        values={filters.skills}
        onChange={(skills) => onChange({ ...filters, skills })}
        editable={editable}
        placeholder="Add a skill..."
        tone="accent"
      />

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
          Years of experience
        </div>
        {editable ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={filters.min_years_experience ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  min_years_experience: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Min"
              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="number"
              min={0}
              value={filters.max_years_experience ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  max_years_experience: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Max"
              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <span className="text-sm text-slate-400">years</span>
          </div>
        ) : (
          <span className="text-sm text-slate-700">
            {filters.min_years_experience ?? filters.max_years_experience
              ? `${filters.min_years_experience ?? "0"}–${filters.max_years_experience ?? "∞"} years`
              : <span className="text-slate-400 italic">Any</span>}
          </span>
        )}
      </div>

      <TagInput
        label="Locations"
        values={filters.locations}
        onChange={(locations) => onChange({ ...filters, locations })}
        editable={editable}
        placeholder="Add a location..."
      />

      <CompanyTypeToggle
        selected={filters.company_types}
        onChange={(company_types) => onChange({ ...filters, company_types })}
        editable={editable}
      />

      <TagInput
        label="Keywords"
        values={filters.keywords}
        onChange={(keywords) => onChange({ ...filters, keywords })}
        editable={editable}
        placeholder="Add a keyword..."
        emptyLabel="None"
      />
    </div>
  );
}

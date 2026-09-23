import { z } from "zod";

export const CompanyTypeSchema = z.enum([
  "startup",
  "scaleup",
  "enterprise",
  "agency",
]);

export const PastCompanySchema = z.object({
  company: z.string(),
  company_type: CompanyTypeSchema,
  title: z.string(),
  years: z.number(),
});

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: CompanyTypeSchema,
  skills: z.array(z.string()),
  past_companies: z.array(PastCompanySchema),
  education: z.string(),
  summary: z.string(),
});

export const ScoredProfileInputSchema = z.object({
  profile: ProfileSchema,
  score: z.number(),
  explanation: z.string(),
});

export const FiltersSchema = z.object({
  skills: z.array(z.string()).default([]),
  min_years_experience: z.number().nullable().default(null),
  max_years_experience: z.number().nullable().default(null),
  locations: z.array(z.string()).default([]),
  company_types: z.array(CompanyTypeSchema).default([]),
  keywords: z.array(z.string()).default([]),
});

export const RubricCriterionSchema = z.object({
  criterion: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(100),
});

export const RubricSchema = z.array(RubricCriterionSchema).min(1);

export const GenerateResultSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
});

export const ScoredProfileSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  explanation: z.string().min(1),
});

export const ScoreResultSchema = z.object({
  scores: z.array(ScoredProfileSchema),
});

export const RefineResultSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
  changeSummary: z.string().min(1),
});

export type FiltersInput = z.infer<typeof FiltersSchema>;
export type GenerateResult = z.infer<typeof GenerateResultSchema>;
export type ScoreResult = z.infer<typeof ScoreResultSchema>;
export type RefineResult = z.infer<typeof RefineResultSchema>;

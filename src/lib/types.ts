export interface PastCompany {
  company: string;
  company_type: CompanyType;
  title: string;
  years: number;
}

export type CompanyType = "startup" | "scaleup" | "enterprise" | "agency";

export interface Profile {
  id: string;
  name: string;
  current_title: string;
  years_experience: number;
  location: string;
  current_company: string;
  current_company_type: CompanyType;
  skills: string[];
  past_companies: PastCompany[];
  education: string;
  summary: string;
}

export interface Filters {
  skills: string[];
  min_years_experience: number | null;
  max_years_experience: number | null;
  locations: string[];
  company_types: CompanyType[];
  keywords: string[];
}

export interface RubricCriterion {
  criterion: string;
  description: string;
  weight: number;
}

export type Rubric = RubricCriterion[];

export interface ScoredProfile {
  profile: Profile;
  score: number;
  explanation: string;
}

export interface ChatTurn {
  role: "recruiter" | "assistant";
  message: string;
  timestamp: number;
}

export type Phase =
  | "idle"
  | "generating"
  | "reviewing"
  | "searching"
  | "results"
  | "refining"
  | "frozen";

export interface SessionState {
  query: string;
  filters: Filters;
  rubric: Rubric;
  results: ScoredProfile[];
  matchedCount: number;
  chat: ChatTurn[];
  phase: Phase;
}

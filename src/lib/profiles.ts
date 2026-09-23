import fs from "node:fs";
import path from "node:path";
import type { Profile } from "./types";

let cached: Profile[] | null = null;

export function getProfiles(): Profile[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "profiles.json");
  const raw = fs.readFileSync(file, "utf-8");
  cached = JSON.parse(raw) as Profile[];
  return cached;
}

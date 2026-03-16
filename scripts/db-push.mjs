import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Load .env.production variables
const envFile = readFileSync(".env.production", "utf-8");
const env = { ...process.env };
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

if (!env.SUPABASE_PROJECT_ID) {
  console.error("SUPABASE_PROJECT_ID is not set in .env.production");
  process.exit(1);
}

execSync(
  `npx supabase link --project-ref ${env.SUPABASE_PROJECT_ID} && npx supabase db push`,
  { stdio: "inherit", env },
);

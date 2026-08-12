import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Vercel hosts Next.js natively — no standalone bundle needed.
if (process.env.VERCEL === "1") {
  console.log("Vercel detected — skipping standalone asset copy.");
  process.exit(0);
}

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const standaloneNext = join(standalone, ".next");

if (!existsSync(standalone)) {
  console.error("Missing .next/standalone — run next build first.");
  process.exit(1);
}

mkdirSync(standaloneNext, { recursive: true });

const staticSrc = join(root, ".next", "static");
const staticDest = join(standaloneNext, "static");
if (!existsSync(staticSrc)) {
  console.error("Missing .next/static — build may have failed.");
  process.exit(1);
}
cpSync(staticSrc, staticDest, { recursive: true });

const publicSrc = join(root, "public");
const publicDest = join(standalone, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
}

console.log("Standalone assets copied (.next/static + public).");

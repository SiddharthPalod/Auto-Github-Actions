import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
  packageManager?: string;
}

const KNOWN_DEPENDENCIES: Record<
  string,
  { category: "frameworks" | "testing" | "tooling"; name: string }
> = {
  // Frameworks
  react: { category: "frameworks", name: "react" },
  next: { category: "frameworks", name: "next" },
  express: { category: "frameworks", name: "express" },
  "@nestjs/core": { category: "frameworks", name: "nestjs" },

  // Testing
  jest: { category: "testing", name: "jest" },
  vitest: { category: "testing", name: "vitest" },
  "@playwright/test": { category: "testing", name: "playwright" },
  cypress: { category: "testing", name: "cypress" },

  // Tooling
  typescript: { category: "tooling", name: "typescript" },
  eslint: { category: "tooling", name: "eslint" },
  prettier: { category: "tooling", name: "prettier" }
};

const LOCKFILES: Array<{ file: string; name: "pnpm" | "yarn" | "npm" | "bun" }> = [
  { file: "pnpm-lock.yaml", name: "pnpm" },
  { file: "yarn.lock", name: "yarn" },
  { file: "package-lock.json", name: "npm" },
  { file: "bun.lock", name: "bun" },
  { file: "bun.lockb", name: "bun" }
];

export const nodeDetector: Detector = {
  name: "node",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const packageFiles = context.findFiles(f => f.endsWith("package.json"));

    for (const pkgFile of packageFiles) {
      const pkg = await context.readJson<PackageJson>(pkgFile);
      if (!pkg) continue;

      // 1. Record Node Runtime
      state.runtime.push({
        name: "node",
        version: pkg.engines?.node,
        evidence: [{ source: pkgFile, value: "node project" }]
      });

      // 2. Detect Package Manager in same directory or root
      const dir = pkgFile.substring(0, pkgFile.lastIndexOf("package.json"));
      for (const { file, name } of LOCKFILES) {
        if (context.hasFile(`${dir}${file}`) || (dir !== "" && context.hasFile(file))) {
          state.packageManager.push({
            name,
            evidence: [{ source: `${dir}${file}`, value: "lockfile detected" }]
          });
          break;
        }
      }

      // 3. Detect Frameworks, Testing, and Tooling
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [depKey, meta] of Object.entries(KNOWN_DEPENDENCIES)) {
        if (depKey in allDeps) {
          state[meta.category].push({
            name: meta.name,
            evidence: [{ source: pkgFile, value: depKey }]
          });
        }
      }
    }

    if (packageFiles.length === 0) {
      const jsTsFiles = context.findFiles(f => f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".jsx") || f.endsWith(".tsx") || f.endsWith(".mjs") || f.endsWith(".cjs"));
      if (jsTsFiles.length > 0) {
        state.runtime.push({
          name: "node",
          version: "20.x",
          evidence: jsTsFiles.slice(0, 5).map(file => ({ source: file, value: "JavaScript/TypeScript source file" }))
        });
        state.packageManager.push({
          name: "npm",
          evidence: jsTsFiles.slice(0, 1).map(file => ({ source: file, value: "Default npm package manager" }))
        });
      }
    }
  }
};
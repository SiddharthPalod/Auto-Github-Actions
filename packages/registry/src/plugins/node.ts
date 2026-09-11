import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

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
  react: { category: "frameworks", name: "react" },
  next: { category: "frameworks", name: "next" },
  express: { category: "frameworks", name: "express" },
  "@nestjs/core": { category: "frameworks", name: "nestjs" },
  jest: { category: "testing", name: "jest" },
  vitest: { category: "testing", name: "vitest" },
  "@playwright/test": { category: "testing", name: "playwright" },
  cypress: { category: "testing", name: "cypress" },
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

export const nodePlugin: AutoGhaPlugin = {
  id: "node",
  name: "Node.js",
  type: "language",
  detection: {
    manifests: ["package.json", "**/package.json"],
    extensions: [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"],
    async predicate(context, state) {
      const packageFiles = context.findFiles(f => f.endsWith("package.json"));

      for (const pkgFile of packageFiles) {
        const pkg = await context.readJson<PackageJson>(pkgFile);
        if (!pkg) continue;

        state.runtime.push({
          name: "node",
          version: pkg.engines?.node,
          evidence: [{ source: pkgFile, value: "node project" }]
        });

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
        const jsTsFiles = context.findFiles(f =>
          f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".jsx") || f.endsWith(".tsx") || f.endsWith(".mjs") || f.endsWith(".cjs")
        );
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
  },
  provides: ["setup", "install", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const isPnpm = ctx.state.packageManager.some(pm => pm.name === "pnpm");
      const steps: StepIR[] = [];

      if (isPnpm) {
        steps.push({
          kind: "uses",
          uses: "pnpm/action-setup@v4",
          source: "pnpm/action-setup@v4"
        });
      }

      const nodeRuntime = ctx.state.runtime.find(r => r.name === "node");
      steps.push({
        kind: "uses",
        uses: "actions/setup-node@v4",
        with: {
          "node-version": nodeRuntime?.version ?? "20.x"
        },
        source: "actions/starter-workflows:ci/node.js.yml"
      });

      return steps;
    },
    install(ctx: ResolverContext): StepIR[] {
      const isPnpm = ctx.state.packageManager.some(pm => pm.name === "pnpm");
      const isYarn = ctx.state.packageManager.some(pm => pm.name === "yarn");
      const isBun = ctx.state.packageManager.some(pm => pm.name === "bun");

      const installCmd = isPnpm
        ? "if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi"
        : isYarn
        ? "if [ -f yarn.lock ]; then yarn install --immutable; else yarn install; fi"
        : isBun
        ? "bun install --frozen-lockfile || bun install"
        : "if [ -f package.json ]; then if [ -f package-lock.json ]; then npm ci; else npm install; fi; fi; for dir in $(find . -name 'package.json' -not -path '*/node_modules/*' -not -path './package.json' -exec dirname {} \\;); do if [ -f \"$dir/package-lock.json\" ]; then (cd \"$dir\" && npm ci); else (cd \"$dir\" && npm install); fi; done";

      return [
        {
          kind: "run",
          run: installCmd,
          source: "engine/dependency-install"
        }
      ];
    },
    test(ctx: ResolverContext): StepIR[] {
      const isPnpm = ctx.state.packageManager.some(pm => pm.name === "pnpm");
      const isYarn = ctx.state.packageManager.some(pm => pm.name === "yarn");
      const isBun = ctx.state.packageManager.some(pm => pm.name === "bun");

      const testCmd = isPnpm
        ? "pnpm test --if-present"
        : isYarn
        ? "yarn test"
        : isBun
        ? "bun test"
        : "if [ -f package.json ]; then npm test --if-present; fi; for dir in $(find . -name 'package.json' -not -path '*/node_modules/*' -not -path './package.json' -exec dirname {} \\;); do (cd \"$dir\" && npm test --if-present); done";

      return [
        {
          kind: "run",
          run: testCmd,
          source: "actions/starter-workflows:ci/node.js.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-node",
    name: "Node.js CI",
    category: "test"
  }
};

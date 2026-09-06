import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  shims: true,
  dts: true,
  clean: true,
  minify: true,
  bundle: true,
  esbuildOptions(options) {
    options.banner = {
      js: "import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);"
    };
  },
  noExternal: [
    "@auto-gha/compiler",
    "@auto-gha/github",
    "@auto-gha/planner",
    "@auto-gha/reconciliation",
    "@auto-gha/resolver",
    "@auto-gha/scanner",
    "@auto-gha/security",
    "@auto-gha/state",
    "@auto-gha/workflow-ir"
  ],
  outDir: "dist"
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  bundle: true,
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

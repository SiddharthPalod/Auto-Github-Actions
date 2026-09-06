import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  bundle: true,
  noExternal: [
    "@zcicd/compiler",
    "@zcicd/github",
    "@zcicd/planner",
    "@zcicd/reconciliation",
    "@zcicd/resolver",
    "@zcicd/scanner",
    "@zcicd/security",
    "@zcicd/state",
    "@zcicd/workflow-ir"
  ],
  outDir: "dist"
});

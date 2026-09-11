import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const rustPlugin: AutoGhaPlugin = {
  id: "rust",
  name: "Rust",
  type: "language",
  detection: {
    manifests: ["Cargo.toml", "Cargo.lock", "**/Cargo.toml"],
    extensions: [".rs"],
    async predicate(context, state) {
      const cargoTomls = context.findFiles(f => f.endsWith("Cargo.toml"));
      if (cargoTomls.length > 0) {
        for (const file of cargoTomls) {
          state.runtime.push({
            name: "rust",
            evidence: [{ source: file, value: "Cargo.toml detected" }]
          });
          state.packageManager.push({
            name: "cargo",
            evidence: [{ source: file, value: "Cargo package manager detected" }]
          });
        }
      } else {
        const rsFiles = context.findFiles(f => f.endsWith(".rs"));
        if (rsFiles.length > 0) {
          state.runtime.push({
            name: "rust",
            evidence: rsFiles.slice(0, 5).map(file => ({ source: file, value: "Rust source file (.rs)" }))
          });
        }
      }
    }
  },
  provides: ["build", "test"],
  resolvers: {
    build(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if [ -f Cargo.toml ]; then cargo build --verbose; else for toml in $(find . -name 'Cargo.toml' -not -path '*/.*' -not -path '*/target/*'); do (cd \"$(dirname \"$toml\")\" && echo \"Building $(dirname \"$toml\")...\" && cargo build --verbose); done; fi",
          source: "actions/starter-workflows:ci/rust.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if [ -f Cargo.toml ]; then cargo test --verbose; else for toml in $(find . -name 'Cargo.toml' -not -path '*/.*' -not -path '*/target/*'); do (cd \"$(dirname \"$toml\")\" && echo \"Testing $(dirname \"$toml\")...\" && cargo test --verbose); done; fi",
          source: "actions/starter-workflows:ci/rust.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-rust",
    name: "Rust CI",
    category: "test"
  }
};

import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const elixirPlugin: AutoGhaPlugin = {
  id: "elixir",
  name: "Elixir",
  type: "language",
  detection: {
    manifests: ["mix.exs", "mix.lock", "**/mix.exs"],
    extensions: [".ex", ".exs"],
    async predicate(context, state) {
      const mixFiles = context.findFiles(f => f.endsWith("mix.exs"));
      if (mixFiles.length > 0) {
        state.runtime.push({
          name: "elixir",
          version: "1.15",
          evidence: mixFiles.map(file => ({ source: file, value: "mix.exs detected" }))
        });
        state.packageManager.push({
          name: "mix",
          evidence: mixFiles.map(file => ({ source: file, value: "Elixir Mix" }))
        });
      } else {
        const exFiles = context.findFiles(f => f.endsWith(".ex") || f.endsWith(".exs"));
        if (exFiles.length > 0) {
          state.runtime.push({
            name: "elixir",
            version: "1.15",
            evidence: exFiles.slice(0, 5).map(file => ({ source: file, value: "Elixir source file (.ex/.exs)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const elixirRuntime = ctx.state.runtime.find(r => r.name === "elixir");
      return [
        {
          kind: "uses",
          uses: "erlef/setup-beam@v1",
          with: {
            "elixir-version": elixirRuntime?.version ?? "1.15",
            "otp-version": "26.0"
          },
          source: "actions/starter-workflows:ci/elixir.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "mix deps.get && mix test",
          source: "actions/starter-workflows:ci/elixir.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-elixir",
    name: "Elixir CI",
    category: "test"
  }
};

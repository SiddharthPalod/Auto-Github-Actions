import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const denoPlugin: AutoGhaPlugin = {
  id: "deno",
  name: "Deno",
  type: "language",
  detection: {
    manifests: ["deno.json", "deno.jsonc", "deno.lock", "**/deno.json"],
    extensions: [],
    async predicate(context, state) {
      const denoFiles = context.findFiles(f => f.endsWith("deno.json") || f.endsWith("deno.jsonc") || f.endsWith("deno.lock"));
      if (denoFiles.length > 0) {
        state.runtime.push({
          name: "deno",
          version: "v1.x",
          evidence: denoFiles.map(file => ({ source: file, value: "Deno configuration detected" }))
        });
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const denoRuntime = ctx.state.runtime.find(r => r.name === "deno");
      return [
        {
          kind: "uses",
          uses: "denoland/setup-deno@v2",
          with: {
            "deno-version": denoRuntime?.version ?? "v1.x"
          },
          source: "actions/starter-workflows:ci/deno.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "deno test",
          source: "actions/starter-workflows:ci/deno.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-deno",
    name: "Deno CI",
    category: "test"
  }
};

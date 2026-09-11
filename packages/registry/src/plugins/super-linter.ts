import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const superLinterPlugin: AutoGhaPlugin = {
  id: "super-linter",
  name: "Super Linter",
  type: "tool",
  detection: {
    manifests: [".github/super-linter.env", ".github/linters"],
    async predicate(context, state) {
      const hasEnv = context.findFiles(f => f.includes("super-linter.env"));
      const hasLinters = context.findFiles(f => f.includes(".github/linters"));
      if (hasEnv.length > 0 || hasLinters.length > 0) {
        state.tooling.push({
          name: "super-linter",
          evidence: [{ source: ".github/super-linter.env", value: "Super-linter configuration detected" }]
        });
      }
    }
  },
  provides: ["lint"],
  resolvers: {
    lint(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "super-linter/super-linter@v7",
          with: {
            DEFAULT_BRANCH: "main",
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
          },
          source: "actions/starter-workflows:ci/super-linter.yml"
        }
      ];
    }
  }
};

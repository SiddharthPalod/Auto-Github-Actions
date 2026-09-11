import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const rPlugin: AutoGhaPlugin = {
  id: "r",
  name: "R Language",
  type: "language",
  detection: {
    manifests: ["DESCRIPTION", "renv.lock", "NAMESPACE"],
    extensions: [".R", ".Rmd"],
    async predicate(context, state) {
      const hasRenvLock = context.findFiles(f => f.endsWith("renv.lock"));
      if (hasRenvLock.length > 0) {
        state.runtime.push({
          name: "r",
          evidence: hasRenvLock.map(file => ({ source: file, value: "renv.lock detected" }))
        });
        return;
      }
      const descFiles = context.findFiles(f => f.endsWith("DESCRIPTION"));
      for (const file of descFiles) {
        const content = await context.readFile(file);
        if (content && content.includes("Package:")) {
          state.runtime.push({
            name: "r",
            evidence: [{ source: file, value: "DESCRIPTION with Package: field detected" }]
          });
        }
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "r-lib/actions/setup-r@v2",
          with: { "r-version": "release" },
          source: "actions/starter-workflows:ci/r.yml"
        },
        {
          kind: "uses",
          uses: "r-lib/actions/setup-r-dependencies@v2",
          with: { "extra-packages": "devtools rcmdcheck" },
          source: "actions/starter-workflows:ci/r.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "r-lib/actions/setup-r@v2",
          with: { "r-version": "release" },
          source: "actions/starter-workflows:ci/r.yml"
        },
        {
          kind: "uses",
          uses: "r-lib/actions/setup-r-dependencies@v2",
          with: { "extra-packages": "devtools rcmdcheck" },
          source: "actions/starter-workflows:ci/r.yml"
        },
        {
          kind: "run",
          run: "Rscript -e 'devtools::test()'",
          source: "actions/starter-workflows:ci/r.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-r",
    name: "R CI",
    category: "test"
  }
};

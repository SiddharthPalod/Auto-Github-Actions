import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const testingPlugin: AutoGhaPlugin = {
  id: "testing",
  name: "Testing Frameworks",
  type: "testing",
  detection: {
    manifests: [],
    async predicate(_context, _state) {
      // Detection is performed via node dependencies in package.json
    }
  },
  provides: ["jest", "vitest", "playwright", "cypress"],
  resolvers: {
    jest(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "npm test -- --ci",
          source: "actions/starter-workflows:ci/node.js.yml"
        }
      ];
    },
    vitest(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "npm run test -- --run",
          source: "actions/starter-workflows:ci/node.js.yml"
        }
      ];
    },
    playwright(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "npx playwright test",
          source: "microsoft/playwright-github-action"
        }
      ];
    },
    cypress(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "npx cypress run",
          source: "cypress-io/github-action"
        }
      ];
    }
  }
};

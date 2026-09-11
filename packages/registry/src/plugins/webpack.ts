import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const webpackPlugin: AutoGhaPlugin = {
  id: "webpack",
  name: "Webpack",
  type: "tool",
  detection: {
    manifests: ["webpack.config.js", "webpack.config.ts", "webpack.config.mjs"],
    async predicate(context, state) {
      const webpackConfigs = context.findFiles(f => {
        const base = f.split("/").pop() ?? "";
        return base === "webpack.config.js" || base === "webpack.config.ts" || base === "webpack.config.mjs";
      });
      if (webpackConfigs.length > 0) {
        state.tooling.push({
          name: "webpack",
          evidence: webpackConfigs.map(file => ({ source: file, value: "webpack.config.* detected" }))
        });
      }
    }
  },
  provides: ["build"],
  resolvers: {
    build(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "npx webpack --mode production",
          source: "actions/starter-workflows:ci/webpack.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "build-webpack",
    name: "Webpack Build",
    category: "build"
  }
};

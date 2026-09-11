import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const stackhawkPlugin: AutoGhaPlugin = {
  id: "stackhawk",
  name: "StackHawk DAST",
  type: "tool",
  detection: {
    manifests: ["stackhawk.yml", "stackhawk.yaml", ".stackhawk/config.yml"],
    async predicate(context, state) {
      const hasConfig = context.findFiles(f =>
        f.endsWith("stackhawk.yml") ||
        f.endsWith("stackhawk.yaml") ||
        f.includes(".stackhawk")
      );
      if (hasConfig.length > 0) {
        state.tooling.push({
          name: "stackhawk",
          evidence: hasConfig.map(file => ({ source: file, value: "StackHawk DAST config detected" }))
        });
      }
    }
  },
  provides: [],
  resolvers: {}
};

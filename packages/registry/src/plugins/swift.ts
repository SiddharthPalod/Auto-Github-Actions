import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const swiftPlugin: AutoGhaPlugin = {
  id: "swift",
  name: "Swift",
  type: "language",
  detection: {
    manifests: ["Package.swift", "**/Package.swift"],
    extensions: [".swift"],
    async predicate(context, state) {
      const packageSwifts = context.findFiles(f => f.endsWith("Package.swift"));
      if (packageSwifts.length > 0) {
        state.runtime.push({
          name: "swift",
          evidence: packageSwifts.map(file => ({ source: file, value: "Package.swift detected" }))
        });
      } else {
        const swiftFiles = context.findFiles(f => f.endsWith(".swift"));
        if (swiftFiles.length > 0) {
          state.runtime.push({
            name: "swift",
            evidence: swiftFiles.slice(0, 5).map(file => ({ source: file, value: "Swift source file (.swift)" }))
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
          run: "swift build -v",
          source: "actions/starter-workflows:ci/swift.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "swift test -v",
          source: "actions/starter-workflows:ci/swift.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-swift",
    name: "Swift CI",
    category: "test"
  }
};

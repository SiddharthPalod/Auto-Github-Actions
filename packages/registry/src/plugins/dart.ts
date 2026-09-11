import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const dartPlugin: AutoGhaPlugin = {
  id: "dart",
  name: "Dart",
  type: "language",
  detection: {
    manifests: ["pubspec.yaml", "pubspec.lock", "**/pubspec.yaml"],
    extensions: [".dart"],
    async predicate(context, state) {
      const pubFiles = context.findFiles(f => f.endsWith("pubspec.yaml"));
      if (pubFiles.length > 0) {
        state.runtime.push({
          name: "dart",
          evidence: pubFiles.map(file => ({ source: file, value: "pubspec.yaml detected" }))
        });
        state.packageManager.push({
          name: "pub",
          evidence: pubFiles.map(file => ({ source: file, value: "Dart Pub package manager" }))
        });
      } else {
        const dartFiles = context.findFiles(f => f.endsWith(".dart"));
        if (dartFiles.length > 0) {
          state.runtime.push({
            name: "dart",
            evidence: dartFiles.slice(0, 5).map(file => ({ source: file, value: "Dart source file (.dart)" }))
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
          uses: "dart-lang/setup-dart@v1",
          source: "actions/starter-workflows:ci/dart.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "dart pub get && dart test",
          source: "actions/starter-workflows:ci/dart.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-dart",
    name: "Dart CI",
    category: "test"
  }
};

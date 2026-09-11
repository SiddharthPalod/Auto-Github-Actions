import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const scalaPlugin: AutoGhaPlugin = {
  id: "scala",
  name: "Scala / SBT",
  type: "language",
  detection: {
    manifests: ["build.sbt", "project/plugins.sbt", "project/build.properties"],
    extensions: [".scala", ".sbt"],
    async predicate(context, state) {
      const hasBuildSbt = context.findFiles(f => f.endsWith("build.sbt"));
      if (hasBuildSbt.length > 0) {
        state.runtime.push({
          name: "scala",
          evidence: hasBuildSbt.map(file => ({ source: file, value: "build.sbt detected" }))
        });
      }
    }
  },
  provides: ["setup", "build", "test"],
  resolvers: {
    setup(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "actions/setup-java@v4",
          with: {
            distribution: "temurin",
            "java-version": "21"
          },
          source: "actions/starter-workflows:ci/scala.yml"
        }
      ];
    },
    build(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "actions/setup-java@v4",
          with: {
            distribution: "temurin",
            "java-version": "21"
          },
          source: "actions/starter-workflows:ci/scala.yml"
        },
        {
          kind: "run",
          run: "sbt compile",
          source: "actions/starter-workflows:ci/scala.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "actions/setup-java@v4",
          with: {
            distribution: "temurin",
            "java-version": "21"
          },
          source: "actions/starter-workflows:ci/scala.yml"
        },
        {
          kind: "run",
          run: "sbt test",
          source: "actions/starter-workflows:ci/scala.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-scala",
    name: "Scala CI",
    category: "test"
  }
};

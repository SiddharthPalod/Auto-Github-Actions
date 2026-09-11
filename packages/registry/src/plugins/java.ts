import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const javaPlugin: AutoGhaPlugin = {
  id: "java",
  name: "Java",
  type: "language",
  detection: {
    manifests: ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts", "**/pom.xml", "**/build.gradle"],
    extensions: [".java"],
    async predicate(context, state) {
      const pomFiles = context.findFiles(f => f.endsWith("pom.xml"));
      if (pomFiles.length > 0) {
        state.runtime.push({
          name: "java",
          version: "17",
          evidence: pomFiles.map(file => ({ source: file, value: "Maven POM detected" }))
        });
        state.packageManager.push({
          name: "maven",
          evidence: pomFiles.map(file => ({ source: file, value: "pom.xml" }))
        });
      }

      const gradleFiles = context.findFiles(f =>
        f.endsWith("build.gradle") || f.endsWith("build.gradle.kts") || f.endsWith("settings.gradle") || f.endsWith("settings.gradle.kts")
      );
      if (gradleFiles.length > 0) {
        if (!state.runtime.some(r => r.name === "java")) {
          state.runtime.push({
            name: "java",
            version: "17",
            evidence: gradleFiles.map(file => ({ source: file, value: "Gradle build file detected" }))
          });
        }
        state.packageManager.push({
          name: "gradle",
          evidence: gradleFiles.map(file => ({ source: file, value: "build.gradle" }))
        });
      }

      if (!state.runtime.some(r => r.name === "java")) {
        const javaFiles = context.findFiles(f => f.endsWith(".java"));
        if (javaFiles.length > 0) {
          state.runtime.push({
            name: "java",
            version: "17",
            evidence: javaFiles.slice(0, 5).map(file => ({ source: file, value: "Java source file (.java)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "build"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const javaRuntime = ctx.state.runtime.find(r => r.name === "java");
      return [
        {
          kind: "uses",
          uses: "actions/setup-java@v4",
          with: {
            "java-version": javaRuntime?.version ?? "17",
            distribution: "temurin"
          },
          source: "actions/starter-workflows:ci/maven.yml"
        }
      ];
    },
    build(ctx: ResolverContext): StepIR[] {
      const isGradle = ctx.state.packageManager.some(pm => pm.name === "gradle");
      const isMaven = ctx.state.packageManager.some(pm => pm.name === "maven");

      if (isGradle) {
        return [
          {
            kind: "uses",
            uses: "gradle/actions/setup-gradle@v4",
            source: "actions/starter-workflows:ci/gradle.yml"
          },
          {
            kind: "run",
            run: "if [ -f gradlew ]; then chmod +x ./gradlew && ./gradlew build; elif [ -f build.gradle ] || [ -f build.gradle.kts ] || [ -f settings.gradle ] || [ -f settings.gradle.kts ]; then gradle build; else for dir in $(find . -maxdepth 5 \\( -name 'build.gradle' -o -name 'build.gradle.kts' -o -name 'settings.gradle' -o -name 'settings.gradle.kts' \\) -not -path '*/.*' -not -path '*/build/*' -exec dirname {} \\; | sort -u); do (cd \"$dir\" && echo \"Building Gradle project in $dir...\" && if [ -f ./gradlew ]; then chmod +x ./gradlew && ./gradlew build; elif [ -f ../gradlew ]; then chmod +x ../gradlew && ../gradlew build; elif [ -f ../../gradlew ]; then chmod +x ../../gradlew && ../../gradlew build; else gradle build; fi); done; fi",
            source: "actions/starter-workflows:ci/gradle.yml"
          }
        ];
      }

      if (isMaven) {
        return [
          {
            kind: "run",
            run: "if [ -f pom.xml ]; then mvn -B package --file pom.xml; else for pom in $(find . -name 'pom.xml' -not -path '*/.*'); do mvn -B package --file \"$pom\"; done; fi",
            source: "actions/starter-workflows:ci/maven.yml"
          }
        ];
      }

      return [
        {
          kind: "run",
          run: 'mkdir -p bin && find . -name "*.java" -not -path "*/.*" > sources.txt && javac -d bin @sources.txt',
          source: "actions/starter-workflows:ci/java.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-java",
    name: "Java CI",
    category: "test"
  }
};

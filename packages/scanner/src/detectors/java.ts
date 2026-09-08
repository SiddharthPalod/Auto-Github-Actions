import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const javaDetector: Detector = {
  name: "java",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    // 1. Maven
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

    // 2. Gradle
    const gradleFiles = context.findFiles(f => f.endsWith("build.gradle") || f.endsWith("build.gradle.kts") || f.endsWith("settings.gradle") || f.endsWith("settings.gradle.kts"));
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

    // 3. Standalone / Raw Java source files (.java)
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
};

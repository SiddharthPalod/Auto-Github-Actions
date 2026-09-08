import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const dartDetector: Detector = {
  name: "dart",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const pubspecFiles = context.findFiles(f => f.endsWith("pubspec.yaml") || f.endsWith("pubspec.yml"));
    if (pubspecFiles.length > 0) {
      state.runtime.push({
        name: "dart",
        version: "stable",
        evidence: pubspecFiles.map(file => ({ source: file, value: "Dart/Flutter project detected" }))
      });
      state.packageManager.push({
        name: "pub",
        evidence: pubspecFiles.map(file => ({ source: file, value: "pubspec.yaml" }))
      });
    } else {
      const dartFiles = context.findFiles(f => f.endsWith(".dart"));
      if (dartFiles.length > 0) {
        state.runtime.push({
          name: "dart",
          version: "stable",
          evidence: dartFiles.slice(0, 5).map(file => ({ source: file, value: "Dart source file (.dart)" }))
        });
      }
    }
  }
};

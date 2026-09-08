import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const swiftDetector: Detector = {
  name: "swift",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const swiftFiles = context.findFiles(f => f.endsWith("Package.swift"));
    if (swiftFiles.length > 0) {
      state.runtime.push({
        name: "swift",
        evidence: swiftFiles.map(file => ({ source: file, value: "Swift package detected" }))
      });
    } else {
      const srcFiles = context.findFiles(f => f.endsWith(".swift"));
      if (srcFiles.length > 0) {
        state.runtime.push({
          name: "swift",
          evidence: srcFiles.slice(0, 5).map(file => ({ source: file, value: "Swift source file (.swift)" }))
        });
      }
    }
  }
};

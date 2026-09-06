import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const cppDetector: Detector = {
  name: "cpp",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const cmakeFiles = context.findFiles(f => f.endsWith("CMakeLists.txt") || f.endsWith("Makefile"));
    if (cmakeFiles.length > 0) {
      state.runtime.push({
        name: "cpp",
        evidence: cmakeFiles.map(file => ({ source: file, value: "C/C++ build configuration detected" }))
      });
    }
  }
};

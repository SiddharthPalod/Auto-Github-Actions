import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const cppDetector: Detector = {
  name: "cpp",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const buildFiles = context.findFiles(f => f.endsWith("CMakeLists.txt") || f.endsWith("Makefile") || f.endsWith("meson.build") || f.endsWith("configure.ac"));
    if (buildFiles.length > 0) {
      state.runtime.push({
        name: "cpp",
        evidence: buildFiles.map(file => ({ source: file, value: "C/C++ build configuration detected" }))
      });
    } else {
      const sourceFiles = context.findFiles(f => f.endsWith(".cpp") || f.endsWith(".c") || f.endsWith(".cc") || f.endsWith(".cxx") || f.endsWith(".h") || f.endsWith(".hpp"));
      if (sourceFiles.length > 0) {
        state.runtime.push({
          name: "cpp",
          evidence: sourceFiles.slice(0, 5).map(file => ({ source: file, value: "C/C++ source files detected" }))
        });
      }
    }
  }
};

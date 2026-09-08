import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const goDetector: Detector = {
  name: "go",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const goModFiles = context.findFiles(f => f.endsWith("go.mod"));

    for (const file of goModFiles) {
      const content = await context.readFile(file);
      if (!content) continue;

      const versionMatch = content.match(/^go\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/m);
      const version = versionMatch?.[1];

      state.runtime.push({
        name: "go",
        version,
        evidence: [{ source: file, value: version ? `go ${version}` : "go.mod detected" }]
      });
    }

    if (goModFiles.length === 0) {
      const goFiles = context.findFiles(f => f.endsWith(".go"));
      if (goFiles.length > 0) {
        state.runtime.push({
          name: "go",
          version: "1.22",
          evidence: goFiles.slice(0, 5).map(file => ({ source: file, value: "Go source file (.go)" }))
        });
      }
    }
  }
};
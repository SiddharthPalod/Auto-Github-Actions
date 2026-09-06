import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const pythonDetector: Detector = {
  name: "python",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const pythonFiles = context.findFiles(
      f => f.endsWith("pyproject.toml") || f.endsWith("requirements.txt") || f.endsWith("Pipfile")
    );

    for (const file of pythonFiles) {
      state.runtime.push({
        name: "python",
        evidence: [{ source: file, value: "Python project detected" }]
      });
    }
  }
};
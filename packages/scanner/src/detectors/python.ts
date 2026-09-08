import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const pythonDetector: Detector = {
  name: "python",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const pythonConfig = context.findFiles(
      f => f.endsWith("pyproject.toml") || f.endsWith("requirements.txt") || f.endsWith("Pipfile") || f.endsWith("setup.py") || f.endsWith("setup.cfg") || f.endsWith("environment.yml") || f.endsWith("poetry.lock")
    );

    if (pythonConfig.length > 0) {
      for (const file of pythonConfig) {
        state.runtime.push({
          name: "python",
          evidence: [{ source: file, value: "Python project detected" }]
        });
      }
    } else {
      const pyFiles = context.findFiles(f => f.endsWith(".py"));
      if (pyFiles.length > 0) {
        state.runtime.push({
          name: "python",
          evidence: pyFiles.slice(0, 5).map(file => ({ source: file, value: "Python source file (.py)" }))
        });
      }
    }
  }
};
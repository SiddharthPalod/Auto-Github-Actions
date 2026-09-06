import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const elixirDetector: Detector = {
  name: "elixir",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const mixFiles = context.findFiles(f => f.endsWith("mix.exs"));
    if (mixFiles.length > 0) {
      state.runtime.push({
        name: "elixir",
        version: "1.15",
        evidence: mixFiles.map(file => ({ source: file, value: "Elixir project detected" }))
      });
      state.packageManager.push({
        name: "mix",
        evidence: mixFiles.map(file => ({ source: file, value: "mix.exs" }))
      });
    }
  }
};

import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const denoDetector: Detector = {
  name: "deno",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const denoFiles = context.findFiles(f => f.endsWith("deno.json") || f.endsWith("deno.jsonc") || f.endsWith("deno.lock"));
    if (denoFiles.length > 0) {
      state.runtime.push({
        name: "deno",
        version: "v1.x",
        evidence: denoFiles.map(file => ({ source: file, value: "Deno configuration detected" }))
      });
    }
  }
};

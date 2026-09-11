import type { ProjectState } from "@auto-gha/state";
import { ALL_PLUGINS } from "@auto-gha/registry";
import { createRepositoryContext } from "./context.js";

export { createRepositoryContext } from "./context.js";
export * from "./detector.js";

export async function scanRepository(root: string): Promise<ProjectState> {
  const context = await createRepositoryContext(root);

  const state: ProjectState = {
    runtime: [],
    packageManager: [],
    frameworks: [],
    testing: [],
    tooling: [],
    infrastructure: []
  };

  for (const plugin of ALL_PLUGINS) {
    if (plugin.detection.predicate) {
      await plugin.detection.predicate(context, state);
    }
  }

  return state;
}
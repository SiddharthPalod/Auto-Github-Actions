import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

const COMPOSE_REGEX = /(^|\/)(docker-)?compose\.(yml|yaml)$/i;

export const dockerDetector: Detector = {
  name: "docker",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    // 1. Dockerfile detection
    const dockerfiles = context.findFiles(
      f => f.endsWith("Dockerfile") || f.includes("/Dockerfile.") || f.startsWith("Dockerfile.")
    );

    for (const df of dockerfiles) {
      state.infrastructure.push({
        name: "docker",
        evidence: [{ source: df, value: "Dockerfile detected" }]
      });
    }

    // 2. Compose file detection
    const composeFiles = context.findFiles(f => COMPOSE_REGEX.test(f));

    for (const cf of composeFiles) {
      state.infrastructure.push({
        name: "docker-compose",
        evidence: [{ source: cf, value: "Compose configuration detected" }]
      });
    }
  }
};
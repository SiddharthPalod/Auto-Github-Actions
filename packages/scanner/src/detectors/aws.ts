import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const awsDetector: Detector = {
  name: "aws",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const awsFiles = context.findFiles(f => {
      const lower = f.toLowerCase();
      return (
        lower.endsWith("task-definition.json") ||
        lower.endsWith("ecs-params.yml") ||
        lower.endsWith("samconfig.toml") ||
        lower.includes(".aws/")
      );
    });

    if (awsFiles.length > 0) {
      state.infrastructure.push({
        name: "aws",
        evidence: awsFiles.map(file => ({
          source: file,
          value: "AWS deployment configuration detected"
        }))
      });
    }
  }
};

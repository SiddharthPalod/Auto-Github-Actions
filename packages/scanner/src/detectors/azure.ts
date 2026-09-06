import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const azureDetector: Detector = {
  name: "azure",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const azureFiles = context.findFiles(f => {
      const lower = f.toLowerCase();
      return (
        lower.endsWith("staticwebapp.config.json") ||
        lower.endsWith("host.json") ||
        lower.endsWith("azure-pipelines.yml") ||
        lower.endsWith("azure-pipelines.yaml")
      );
    });

    if (azureFiles.length > 0) {
      state.infrastructure.push({
        name: "azure",
        evidence: azureFiles.map(file => ({
          source: file,
          value: "Azure deployment configuration detected"
        }))
      });
    }
  }
};

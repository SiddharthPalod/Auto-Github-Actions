import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const gcpDetector: Detector = {
  name: "gcp",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const gcpFiles = context.findFiles(f => {
      const lower = f.toLowerCase();
      return (
        lower.endsWith("app.yaml") ||
        lower.endsWith("cloudbuild.yaml") ||
        lower.endsWith("cloudbuild.yml") ||
        lower.endsWith("cloudrun.yaml")
      );
    });

    if (gcpFiles.length > 0) {
      state.infrastructure.push({
        name: "gcp",
        evidence: gcpFiles.map(file => ({
          source: file,
          value: "GCP deployment configuration detected"
        }))
      });
    }
  }
};

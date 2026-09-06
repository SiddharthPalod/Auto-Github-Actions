import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const k8sDetector: Detector = {
  name: "kubernetes",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const k8sFiles = context.findFiles(f => {
      const lower = f.toLowerCase();
      return (
        lower.endsWith("chart.yaml") ||
        lower.endsWith("values.yaml") ||
        lower.includes("k8s/") ||
        lower.includes("manifests/") ||
        lower.endsWith("deployment.yaml") ||
        lower.endsWith("service.yaml")
      );
    });

    if (k8sFiles.length > 0) {
      state.infrastructure.push({
        name: "kubernetes",
        evidence: k8sFiles.map(file => ({
          source: file,
          value: "Kubernetes/Helm configuration detected"
        }))
      });
    }
  }
};

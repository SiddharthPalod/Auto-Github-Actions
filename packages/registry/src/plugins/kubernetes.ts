import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const kubernetesPlugin: AutoGhaPlugin = {
  id: "kubernetes",
  name: "Kubernetes",
  type: "deployment",
  detection: {
    manifests: [
      "Chart.yaml",
      "values.yaml",
      "deployment.yaml",
      "service.yaml",
      "**/Chart.yaml",
      "**/deployment.yaml",
      "k8s/*.yaml",
      "manifests/*.yaml"
    ],
    async predicate(context, state) {
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
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          id: "setup-helm",
          name: "Set up Helm",
          kind: "uses",
          uses: "azure/setup-helm@v4.2.0",
          source: "actions/starter-workflows:deployments/azure-kubernetes-service-helm.yml"
        },
        {
          id: "k8s-deploy",
          name: "Deploy to Kubernetes",
          kind: "run",
          run: "helm upgrade --install release . --wait",
          source: "actions/starter-workflows:deployments/azure-kubernetes-service-helm.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-k8s",
    name: "Deploy to Kubernetes",
    category: "deploy"
  }
};

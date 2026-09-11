import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const gcpPlugin: AutoGhaPlugin = {
  id: "gcp",
  name: "Google Cloud Run",
  type: "deployment",
  detection: {
    manifests: ["app.yaml", "cloudbuild.yaml", "cloudbuild.yml", "cloudrun.yaml", "**/app.yaml", "**/cloudbuild.yaml"],
    async predicate(context, state) {
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
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          id: "gcp-auth",
          name: "Authenticate to Google Cloud",
          kind: "uses",
          uses: "google-github-actions/auth@v2",
          with: {
            credentials_json: "${{ secrets.GCP_SA_KEY }}"
          },
          source: "actions/starter-workflows:deployments/google-cloudrun-docker.yml"
        },
        {
          id: "gcp-deploy",
          name: "Deploy to Cloud Run",
          kind: "uses",
          uses: "google-github-actions/deploy-cloudrun@v2",
          with: {
            service: "${{ vars.K_SERVICE || 'app' }}",
            region: "${{ vars.GCP_REGION || 'us-central1' }}",
            source: "./"
          },
          source: "actions/starter-workflows:deployments/google-cloudrun-docker.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-gcp",
    name: "Deploy to Google Cloud Run",
    category: "deploy"
  }
};

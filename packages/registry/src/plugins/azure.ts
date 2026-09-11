import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const azurePlugin: AutoGhaPlugin = {
  id: "azure",
  name: "Azure Web App",
  type: "deployment",
  detection: {
    manifests: [
      "staticwebapp.config.json",
      "host.json",
      "azure-pipelines.yml",
      "azure-pipelines.yaml",
      "**/staticwebapp.config.json"
    ],
    async predicate(context, state) {
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
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          id: "azure-login",
          name: "Azure Login",
          kind: "uses",
          uses: "azure/login@v2",
          with: {
            creds: "${{ secrets.AZURE_CREDENTIALS }}"
          },
          source: "actions/starter-workflows:deployments/azure-container-webapp.yml"
        },
        {
          id: "azure-deploy",
          name: "Deploy to Azure Web App",
          kind: "uses",
          uses: "azure/webapps-deploy@v3",
          with: {
            "app-name": "${{ vars.AZURE_WEBAPP_NAME }}",
            images: "${{ vars.DOCKER_IMAGE || 'app:latest' }}"
          },
          source: "actions/starter-workflows:deployments/azure-container-webapp.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-azure",
    name: "Deploy to Azure Web App",
    category: "deploy"
  }
};

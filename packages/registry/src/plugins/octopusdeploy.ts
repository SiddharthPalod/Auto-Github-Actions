import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const octopusdeployPlugin: AutoGhaPlugin = {
  id: "octopusdeploy",
  name: "Octopus Deploy",
  type: "deployment",
  detection: {
    manifests: [".octopus", "octopus.json", ".octopus/deployment_process.ocl"],
    async predicate(context, state) {
      const hasOctopus = context.findFiles(f =>
        f.includes(".octopus") ||
        f.endsWith("octopus.json")
      );
      if (hasOctopus.length > 0) {
        state.infrastructure.push({
          name: "octopusdeploy",
          evidence: hasOctopus.map(file => ({ source: file, value: "Octopus Deploy config detected" }))
        });
      }
    }
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "OctopusDeploy/install-octopus-cli-action@v1",
          with: {
            version: "latest"
          },
          source: "actions/starter-workflows:deployments/octopusdeploy.yml"
        },
        {
          kind: "uses",
          uses: "OctopusDeploy/push-package-action@v3",
          with: {
            server: "${{ secrets.OCTOPUS_SERVER_URL }}",
            api_key: "${{ secrets.OCTOPUS_API_KEY }}",
            space: "Default"
          },
          source: "actions/starter-workflows:deployments/octopusdeploy.yml"
        },
        {
          kind: "uses",
          uses: "OctopusDeploy/create-release-action@v3",
          with: {
            server: "${{ secrets.OCTOPUS_SERVER_URL }}",
            api_key: "${{ secrets.OCTOPUS_API_KEY }}",
            project: "${{ env.OCTOPUS_PROJECT }}",
            space: "Default"
          },
          source: "actions/starter-workflows:deployments/octopusdeploy.yml"
        }
      ];
    }
  }
};

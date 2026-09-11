import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const ibmPlugin: AutoGhaPlugin = {
  id: "ibm",
  name: "IBM Cloud",
  type: "deployment",
  detection: {
    manifests: ["ibm-cloud.yml", ".bluemix/pipeline.yml", "manifest.yml", "manifest.yaml"],
    async predicate(context, state) {
      const hasIbm = context.findFiles(f =>
        f.endsWith("ibm-cloud.yml") ||
        f.includes(".bluemix") ||
        f.endsWith("manifest.yml")
      );
      if (hasIbm.length > 0) {
        state.infrastructure.push({
          name: "ibm",
          evidence: hasIbm.map(file => ({ source: file, value: "IBM Cloud config detected" }))
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
          uses: "IBM/actions-ibmcloud-cli@v1",
          with: {
            "ibmcloud-api-key": "${{ secrets.IBM_CLOUD_API_KEY }}"
          },
          source: "actions/starter-workflows:deployments/ibm.yml"
        },
        {
          kind: "run",
          run: "ibmcloud ks cluster config --cluster ${{ env.MY_CLUSTER }} && kubectl apply -f k8s/",
          source: "actions/starter-workflows:deployments/ibm.yml"
        }
      ];
    }
  }
};

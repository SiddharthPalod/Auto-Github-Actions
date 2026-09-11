import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const tencentPlugin: AutoGhaPlugin = {
  id: "tencent",
  name: "Tencent Cloud",
  type: "deployment",
  detection: {
    manifests: ["tke-service.json", "tencentcloud.yaml", ".tencent/config"],
    async predicate(context, state) {
      const hasTencent = context.findFiles(f =>
        f.endsWith("tencentcloud.yaml") ||
        f.endsWith("tke-service.json") ||
        f.includes(".tencent")
      );
      if (hasTencent.length > 0) {
        state.infrastructure.push({
          name: "tencent",
          evidence: hasTencent.map(file => ({ source: file, value: "Tencent Cloud config detected" }))
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
          uses: "tencentcloud-actions/setup-tccli@v1",
          with: {
            "secret-id": "${{ secrets.TENCENT_SECRET_ID }}",
            "secret-key": "${{ secrets.TENCENT_SECRET_KEY }}",
            region: "ap-guangzhou"
          },
          source: "actions/starter-workflows:deployments/tencent.yml"
        },
        {
          kind: "run",
          run: "tccli tke DescribeClusterKubeconfig --clusterId ${{ env.TKE_CLUSTER_ID }} && kubectl apply -f k8s/",
          source: "actions/starter-workflows:deployments/tencent.yml"
        }
      ];
    }
  }
};

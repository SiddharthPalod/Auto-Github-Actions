import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const openshiftPlugin: AutoGhaPlugin = {
  id: "openshift",
  name: "Red Hat OpenShift",
  type: "deployment",
  detection: {
    manifests: [".openshift", "openshift/release.yml", "openshift/template.yml"],
    async predicate(context, state) {
      const hasOpenshift = context.findFiles(f => f.includes(".openshift") || f.includes("openshift/"));
      if (hasOpenshift.length > 0) {
        state.infrastructure.push({
          name: "openshift",
          evidence: hasOpenshift.map(file => ({ source: file, value: "OpenShift config detected" }))
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
          uses: "redhat-actions/openshift-tools-installer@v1",
          with: {
            oc: "4"
          },
          source: "actions/starter-workflows:deployments/openshift.yml"
        },
        {
          kind: "uses",
          uses: "redhat-actions/oc-login@v1",
          with: {
            openshift_server_url: "${{ secrets.OPENSHIFT_SERVER }}",
            openshift_token: "${{ secrets.OPENSHIFT_TOKEN }}",
            insecure_skip_tls_verify: true
          },
          source: "actions/starter-workflows:deployments/openshift.yml"
        },
        {
          kind: "run",
          run: "oc rollout status dc/${{ env.OPENSHIFT_APP_NAME }}",
          source: "actions/starter-workflows:deployments/openshift.yml"
        }
      ];
    }
  }
};

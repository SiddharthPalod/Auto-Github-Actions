import type { PlannedAction } from "@zcicd/planner";
import type { ResolvedPrimitive } from "../types.js";
import { STARTER_WORKFLOWS_CATALOG } from "../catalog/starter-workflows.js";

export function resolveDockerBuild(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/docker-image.yml"];
  const dockerStep = template.steps.find(s => s.id === "docker-build");

  return [
    {
      kind: "uses",
      uses: dockerStep?.uses ?? "docker/build-push-action@v6",
      with: {
        ...(dockerStep?.with ?? { push: false }),
        file: action.inputs?.file ?? "Dockerfile",
        context: action.inputs?.context ?? "."
      },
      reason: "Build Docker image from starter workflow pattern.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}
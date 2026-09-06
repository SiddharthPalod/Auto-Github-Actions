import { describe, it, expect } from "vitest";
import type { WorkflowIR } from "@auto-gha/workflow-ir";
import { reconcileWorkflows } from "./index.js";

describe("Phase 7 - Workflow Reconciliation Engine", () => {
  const desiredIR: WorkflowIR = {
    name: "CI",
    triggers: [{ event: "push", branches: ["main"] }],
    jobs: [
      {
        id: "test-node",
        name: "Node.js CI",
        runsOn: "ubuntu-latest",
        steps: [
          { kind: "uses", uses: "actions/checkout@v4" },
          { kind: "uses", uses: "actions/setup-node@v4", with: { "node-version": "20.x", cache: "npm" } },
          { kind: "run", run: "npm test" }
        ]
      }
    ]
  };

  it("returns 'create' when no existing workflow exists", () => {
    const plan = reconcileWorkflows(null, desiredIR);
    expect(plan.status).toBe("create");
    expect(plan.jobDiffs).toHaveLength(1);
    expect(plan.jobDiffs[0].type).toBe("added");
    expect(plan.customStepsPreserved).toBe(0);
  });

  it("returns 'identical' when existing workflow exactly matches desired state", () => {
    const existingYaml = `
name: CI
on:
  push:
    branches:
      - main
jobs:
  test-node:
    name: Node.js CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: npm
      - run: npm test
`;
    const plan = reconcileWorkflows(existingYaml, desiredIR);
    expect(plan.status).toBe("identical");
    expect(plan.customStepsPreserved).toBe(0);
  });

  it("preserves custom user steps (non-destructive upgrade) when merging with compiler output", () => {
    const existingYamlWithCustomDeploy = `
name: CI
on:
  push:
    branches:
      - main
jobs:
  test-node:
    name: Node.js CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - name: Deploy to Vercel
        run: npx vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}
`;
    const plan = reconcileWorkflows(existingYamlWithCustomDeploy, desiredIR);
    expect(plan.status).toBe("upgrade");
    expect(plan.customStepsPreserved).toBe(1);

    const mergedSteps = plan.mergedIR.jobs[0].steps;
    expect(mergedSteps).toHaveLength(4); // checkout, setup-node, npm test, deploy to vercel
    expect(mergedSteps.some(s => s.kind === "run" && s.run?.includes("vercel"))).toBe(true);
    expect(mergedSteps.some(s => s.kind === "uses" && s.uses.includes("setup-node"))).toBe(true);
  });
});


import { describe, it, expect } from "vitest";
import { planWorkflow } from "./planner.js";
import { resolveCapabilities } from "./capabilities.js";
import type { ProjectState } from "@auto-gha/state";

describe("Planner - Capabilities & Rule Engine", () => {
  it("resolves capabilities and plans workflow for a Node + TypeScript + Vitest project", () => {
    const state: ProjectState = {
      runtime: [{ name: "node", version: "22.x", evidence: [{ source: "package.json", value: "node project" }] }],
      packageManager: [{ name: "pnpm", evidence: [{ source: "pnpm-lock.yaml", value: "lockfile detected" }] }],
      frameworks: [{ name: "react", evidence: [{ source: "package.json", value: "react" }] }],
      testing: [{ name: "vitest", evidence: [{ source: "package.json", value: "vitest" }] }],
      tooling: [{ name: "typescript", evidence: [{ source: "package.json", value: "typescript" }] }],
      infrastructure: []
    };

    const capabilities = resolveCapabilities(state);
    expect(capabilities.map(c => c.id)).toContain("runtime.node");
    expect(capabilities.map(c => c.id)).toContain("package.pnpm");
    expect(capabilities.map(c => c.id)).toContain("test.vitest");

    const plan = planWorkflow(state);
    expect(plan.matchedRules).toContain("node-setup");
    expect(plan.matchedRules).toContain("vitest-test");

    const actionTypes = plan.actions.map(a => a.type);
    expect(actionTypes).toContain("runtime.setup");
    expect(actionTypes).toContain("test.unit");
  });

  it("plans docker and python workflows when detected", () => {
    const state: ProjectState = {
      runtime: [{ name: "python", evidence: [{ source: "requirements.txt", value: "Python project detected" }] }],
      packageManager: [],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: [{ name: "docker", evidence: [{ source: "Dockerfile", value: "Dockerfile detected" }] }]
    };

    const plan = planWorkflow(state);
    expect(plan.matchedRules).toContain("python-test");
    expect(plan.matchedRules).toContain("docker-build");

    const actionTypes = plan.actions.map(a => a.type);
    expect(actionTypes).toContain("python.test");
    expect(actionTypes).toContain("docker.build");
  });
});


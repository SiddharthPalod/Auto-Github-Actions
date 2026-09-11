import { describe, it, expect } from "vitest";
import { resolvePlan, resolveAction } from "./resolver.js";
import { getPlugin } from "@auto-gha/registry";
import type { WorkflowPlan } from "@auto-gha/planner";

describe("Resolver — Plugin Registry Integration", () => {
  it("plugin registry contains all core ecosystems", () => {
    expect(getPlugin("node")).toBeDefined();
    expect(getPlugin("go")).toBeDefined();
    expect(getPlugin("python")).toBeDefined();
    expect(getPlugin("docker")).toBeDefined();
    expect(getPlugin("rust")).toBeDefined();
  });

  it("resolves node setup with starter workflow provenance", () => {
    const plan: WorkflowPlan = {
      capabilities: [],
      matchedRules: ["node-setup", "vitest-test"],
      diagnostics: [],
      actions: [
        {
          id: "node-setup",
          type: "runtime.setup",
          inputs: { runtime: "node", version: "20.x" },
          reason: "Node runtime detected.",
          sourceRule: "node-setup"
        },
        {
          id: "vitest-test",
          type: "test.unit",
          inputs: { framework: "vitest" },
          reason: "Vitest detected.",
          sourceRule: "vitest-test"
        }
      ]
    };

    const resolved = resolvePlan(plan);
    expect(resolved.warnings).toHaveLength(0);
    expect(resolved.primitives).toHaveLength(2);

    const setupNode = resolved.primitives[0];
    expect(setupNode.kind).toBe("uses");
    if (setupNode.kind === "uses") {
      expect(setupNode.uses).toBe("actions/setup-node@v4");
      expect(setupNode.with).toEqual({ "node-version": "20.x" });
      expect(setupNode.source).toBe("actions/starter-workflows:ci/node.js.yml");
    }

    const testStep = resolved.primitives[1];
    expect(testStep.kind).toBe("run");
    expect(testStep.source).toBe("actions/starter-workflows:ci/node.js.yml");
  });

  it("resolves Go build and test actions with starter workflow provenance", () => {
    const buildResult = resolveAction({
      id: "go-build",
      type: "go.build",
      inputs: { version: "1.25.5" },
      reason: "Go detected",
      sourceRule: "go-build"
    });

    expect(buildResult.warnings).toHaveLength(0);
    expect(buildResult.resolved).toHaveLength(2);
    expect(buildResult.resolved[0].source).toBe("actions/starter-workflows:ci/go.yml");
    expect(buildResult.resolved[1].source).toBe("actions/starter-workflows:ci/go.yml");
    if (buildResult.resolved[0].kind === "uses") {
      expect(buildResult.resolved[0].with).toEqual({ "go-version": "1.25.5" });
    }
  });

  it("resolves Docker build actions with starter workflow provenance", () => {
    const dockerResult = resolveAction({
      id: "docker-build",
      type: "docker.build",
      reason: "Docker detected",
      sourceRule: "docker-build"
    });

    expect(dockerResult.warnings).toHaveLength(0);
    expect(dockerResult.resolved[0].kind).toBe("uses");
    expect(dockerResult.resolved[0].source).toBe("actions/starter-workflows:ci/docker-image.yml");
  });
});


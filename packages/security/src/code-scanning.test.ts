import { describe, it, expect } from "vitest";
import type { ProjectState } from "@auto-gha/state";
import { compileSecurityPolicy, resolveSecurityPolicy } from "./index.js";

describe("Phase 6B - Universal Code Scanning Catalog", () => {
  it("resolves Hadolint, Bandit, and njsscan for Docker + Python + Node polyglot project at Standard level", () => {
    const state: ProjectState = {
      runtime: [
        { name: "node", evidence: [{ source: "frontend/package.json", value: "Node" }] },
        { name: "python", evidence: [{ source: "backend/requirements.txt", value: "Python" }] }
      ],
      packageManager: [
        { name: "npm", evidence: [{ source: "frontend/package-lock.json", value: "npm" }] },
        { name: "pip", evidence: [{ source: "backend/requirements.txt", value: "pip" }] }
      ],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: [
        { name: "docker", evidence: [{ source: "Dockerfile", value: "Docker" }] }
      ]
    };

    const artifacts = compileSecurityPolicy(state, "standard");
    expect(artifacts.policy.codeScanning.enabled).toBe(true);

    expect(artifacts.codeScanningYaml).toBeDefined();
    expect(artifacts.codeScanningYaml).toContain("hadolint/hadolint-action@v3.1.0");
    expect(artifacts.codeScanningYaml).toContain("pip install bandit");
    expect(artifacts.codeScanningYaml).toContain("ajinabraham/njsscan-action@master");
    expect(artifacts.codeScanningYaml).toContain("actions/dependency-review-action@v4");
    expect(artifacts.codeScanningYaml).toContain("google/osv-scanner-action");
  });

  it("resolves Brakeman for Ruby on Rails project", () => {
    const railsState: ProjectState = {
      runtime: [{ name: "ruby", evidence: [{ source: "Gemfile", value: "Ruby" }] }],
      packageManager: [{ name: "bundler", evidence: [{ source: "Gemfile.lock", value: "bundler" }] }],
      frameworks: [{ name: "rails", evidence: [{ source: "config/application.rb", value: "Rails" }] }],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const artifacts = compileSecurityPolicy(railsState, "standard");
    expect(artifacts.codeScanningYaml).toContain("brakeman/brakeman-action@v1");
  });

  it("resolves Semgrep and OpenSSF Scorecard in Strict mode", () => {
    const projectState: ProjectState = {
      runtime: [{ name: "go", evidence: [{ source: "main.go", value: "Go" }] }],
      packageManager: [{ name: "gomod", evidence: [{ source: "go.mod", value: "gomod" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const artifacts = compileSecurityPolicy(projectState, "strict");
    expect(artifacts.codeScanningYaml).toContain("returntocorp/semgrep-action@v1");
    expect(artifacts.codeScanningYaml).toContain("ossf/scorecard-action@v2.4.0");
    expect(artifacts.codeScanningYaml).toContain("step-security/harden-runner@v2");
  });
});


import { describe, it, expect } from "vitest";
import type { ProjectState } from "@auto-gha/state";
import { compileSecurityPolicy, resolveSecurityPolicy } from "./index.js";

describe("Phase 6 - Security Policy Compiler", () => {
  const rustState: ProjectState = {
    runtime: [{ name: "rust", evidence: [{ source: "backend/Cargo.toml", value: "Cargo" }] }],
    packageManager: [{ name: "cargo", evidence: [{ source: "Cargo.lock", value: "lock" }] }],
    frameworks: [],
    testing: [],
    tooling: [],
    infrastructure: []
  };

  const polyglotState: ProjectState = {
    runtime: [
      { name: "node", evidence: [{ source: "spotiflix/api/package.json", value: "node" }] },
      { name: "node", evidence: [{ source: "spotiflix/netflix/package.json", value: "node" }] },
      { name: "python", evidence: [{ source: "spotiflix/ml/requirements.txt", value: "python" }] }
    ],
    packageManager: [
      { name: "npm", evidence: [{ source: "spotiflix/api/package-lock.json", value: "npm" }] },
      { name: "npm", evidence: [{ source: "spotiflix/netflix/package-lock.json", value: "npm" }] }
    ],
    frameworks: [],
    testing: [],
    tooling: [],
    infrastructure: [
      { name: "docker", evidence: [{ source: "spotiflix/api/Dockerfile", value: "docker" }] },
      { name: "docker", evidence: [{ source: "spotiflix/netflix/Dockerfile", value: "docker" }] }
    ]
  };

  it("resolves SecurityPolicyIR for Rust project and emits cargo audit + Dependabot", () => {
    const artifacts = compileSecurityPolicy(rustState, "standard");

    expect(artifacts.policy.level).toBe("standard");
    expect(artifacts.policy.dependabot.enabled).toBe(true);

    // Dependabot YAML
    expect(artifacts.dependabotYaml).toBeDefined();
    expect(artifacts.dependabotYaml).toContain("package-ecosystem: cargo");
    expect(artifacts.dependabotYaml).toContain("package-ecosystem: github-actions");

    // Native audits
    expect(artifacts.policy.nativeAudits).toHaveLength(1);
    expect(artifacts.policy.nativeAudits[0].command).toContain("cargo audit");

    // Security workflow YAML
    expect(artifacts.securityWorkflowYaml).toBeDefined();
    expect(artifacts.securityWorkflowYaml).toContain("cargo audit");

    // CodeQL should be undefined for Rust (no CodeQL supported languages in project)
    expect(artifacts.codeqlYaml).toBeUndefined();
  });

  it("resolves full suite (CodeQL, Trivy, Dependabot, Audits) for polyglot project at Standard level", () => {
    const artifacts = compileSecurityPolicy(polyglotState, "standard");

    // 1. Dependabot
    expect(artifacts.dependabotYaml).toBeDefined();
    expect(artifacts.dependabotYaml).toContain("directory: /spotiflix/api");
    expect(artifacts.dependabotYaml).toContain("directory: /spotiflix/netflix");
    expect(artifacts.dependabotYaml).toContain("directory: /spotiflix/ml");
    expect(artifacts.dependabotYaml).toContain("package-ecosystem: docker");

    // 2. CodeQL
    expect(artifacts.codeqlYaml).toBeDefined();
    expect(artifacts.codeqlYaml).toContain("javascript-typescript");
    expect(artifacts.codeqlYaml).toContain("python");

    // 3. Security Workflow (Trivy + Audits)
    expect(artifacts.securityWorkflowYaml).toBeDefined();
    expect(artifacts.securityWorkflowYaml).toContain("npm audit");
    expect(artifacts.securityWorkflowYaml).toContain("pip-audit");
    expect(artifacts.securityWorkflowYaml).toContain("aquasecurity/trivy-action");
    expect(artifacts.securityWorkflowYaml).toContain("local-scan-target:latest");
  });

  it("enforces Strict mode with daily Dependabot, Gitleaks, Harden-Runner, and blocking gates", () => {
    const policy = resolveSecurityPolicy(polyglotState, "strict");

    expect(policy.level).toBe("strict");
    expect(policy.enforcement.blockOnVulnerabilities).toBe(true);
    expect(policy.secretScanning.enabled).toBe(true);
    expect(policy.containerScanning.uploadSarif).toBe(true);

    const artifacts = compileSecurityPolicy(polyglotState, "strict");

    expect(artifacts.dependabotYaml).toContain("interval: daily");
    expect(artifacts.securityWorkflowYaml).toContain("step-security/harden-runner");
    expect(artifacts.securityWorkflowYaml).toContain("gitleaks/gitleaks-action");
    expect(artifacts.securityWorkflowYaml).toContain("upload-sarif");
  });

  it("skips non-essential scans in Minimal mode", () => {
    const policy = resolveSecurityPolicy(polyglotState, "minimal");

    expect(policy.level).toBe("minimal");
    expect(policy.codeql.enabled).toBe(false);
    expect(policy.containerScanning.enabled).toBe(false);
    expect(policy.secretScanning.enabled).toBe(false);

    const artifacts = compileSecurityPolicy(polyglotState, "minimal");

    expect(artifacts.codeqlYaml).toBeUndefined();
    expect(artifacts.dependabotYaml).toBeDefined();
    expect(artifacts.securityWorkflowYaml).toContain("npm audit");
    expect(artifacts.securityWorkflowYaml).not.toContain("trivy-action");
  });
});


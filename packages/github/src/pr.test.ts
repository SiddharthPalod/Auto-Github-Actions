import { describe, it, expect } from "vitest";
import type { ProjectState } from "@auto-gha/state";
import type { WorkflowIR } from "@auto-gha/workflow-ir";
import type { GeneratedSecurityArtifacts } from "@auto-gha/security";
import { generatePullRequestBody } from "./index.js";

describe("Phase 7 - GitHub PR Automation", () => {
  const state: ProjectState = {
    runtime: [{ name: "rust", evidence: [{ source: "backend/Cargo.toml", value: "Cargo" }] }],
    packageManager: [{ name: "cargo", evidence: [{ source: "Cargo.lock", value: "lock" }] }],
    frameworks: [],
    testing: [],
    tooling: [],
    infrastructure: []
  };

  const ir: WorkflowIR = {
    name: "CI",
    triggers: [{ event: "push", branches: ["main"] }],
    jobs: [
      {
        id: "test-rust",
        name: "Rust CI",
        runsOn: "ubuntu-latest",
        steps: [
          { kind: "uses", uses: "actions/checkout@v4" },
          { kind: "run", run: "cargo test" }
        ]
      }
    ]
  };

  const security: GeneratedSecurityArtifacts = {
    policy: {
      level: "standard",
      dependabot: { enabled: true, ecosystems: [{ packageEcosystem: "cargo", directory: "/", interval: "weekly" }] },
      nativeAudits: [{ tool: "cargo-audit", command: "cargo audit", failOnError: false }],
      codeql: { enabled: false, languages: [] },
      codeScanning: { enabled: false, scanners: [] },
      containerScanning: { enabled: false, dockerfiles: [], severityThreshold: "CRITICAL", uploadSarif: false },
      secretScanning: { enabled: false, tool: "gitleaks" },
      enforcement: { blockOnVulnerabilities: false }
    },
    dependabotYaml: "version: 2\nupdates: []",
    securityWorkflowYaml: "name: Security\njobs: {}"
  };

  it("generates markdown PR body containing architecture tables, CI jobs, and security features", () => {
    const body = generatePullRequestBody({
      repoPath: "./",
      remoteUrl: "https://github.com/SiddharthPalod/ArgusMesh",
      state,
      ir,
      security,
      files: [
        { relativePath: ".github/workflows/ci.yml", content: "..." },
        { relativePath: ".github/dependabot.yml", content: "..." }
      ]
    });

    expect(body).toContain("## ðŸš€ Zero-Config CI/CD & Security Automation");
    expect(body).toContain("`rust`");
    expect(body).toContain("`cargo`");
    expect(body).toContain("**Rust CI**");
    expect(body).toContain("Dependabot");
    expect(body).toContain("cargo-audit");
    expect(body).toContain("`.github/workflows/ci.yml`");
  });
});


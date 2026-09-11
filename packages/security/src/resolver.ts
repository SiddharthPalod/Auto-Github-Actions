import type { ProjectState } from "@auto-gha/state";
import type {
  SecurityLevel,
  SecurityPolicyIR,
  DependabotTarget,
  DependabotEcosystem,
  CodeQLLanguage,
  NativeAuditConfig,
  CodeScanningTargetConfig
} from "./types.js";

function getDir(sourcePath: string): string {
  const normalized = sourcePath.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash === -1) return "/";
  const dir = normalized.slice(0, lastSlash);
  return dir.startsWith("/") ? dir : `/${dir}`;
}

export function resolveSecurityPolicy(
  state: ProjectState,
  level: SecurityLevel = "standard"
): SecurityPolicyIR {
  if (level === "none") {
    return {
      level: "none",
      dependabot: { enabled: false, ecosystems: [] },
      nativeAudits: [],
      codeql: { enabled: false, languages: [] },
      codeScanning: { enabled: false, scanners: [] },
      containerScanning: { enabled: false, dockerfiles: [], severityThreshold: "CRITICAL", uploadSarif: false },
      secretScanning: { enabled: false, tool: "gitleaks" },
      enforcement: { blockOnVulnerabilities: false }
    };
  }

  const interval = level === "strict" ? "daily" : "weekly";
  const blockOnVulnerabilities = level === "strict";

  // 1. Resolve Dependabot Targets
  const dependabotTargets: DependabotTarget[] = [];
  const seenTargets = new Set<string>();

  function addTarget(ecosystem: DependabotEcosystem, dir: string) {
    const key = `${ecosystem}:${dir}`;
    if (!seenTargets.has(key)) {
      seenTargets.add(key);
      dependabotTargets.push({ packageEcosystem: ecosystem, directory: dir, interval });
    }
  }

  // Always check GitHub Actions workflows
  addTarget("github-actions", "/");

  // Check Package Managers
  for (const pm of state.packageManager) {
    for (const ev of pm.evidence) {
      const dir = getDir(ev.source);
      if (pm.name === "npm" || pm.name === "pnpm" || pm.name === "yarn" || pm.name === "bun") {
        addTarget("npm", dir);
      } else if (pm.name === "cargo") {
        addTarget("cargo", dir);
      } else if (pm.name === "pip" || pm.name === "poetry") {
        addTarget("pip", dir);
      } else if (pm.name === "gomod") {
        addTarget("gomod", dir);
      } else if (pm.name === "maven") {
        addTarget("maven", dir);
      } else if (pm.name === "gradle") {
        addTarget("gradle", dir);
      } else if (pm.name === "nuget") {
        addTarget("nuget", dir);
      } else if (pm.name === "bundler") {
        addTarget("bundler", dir);
      } else if (pm.name === "composer") {
        addTarget("composer", dir);
      } else if (pm.name === "pub") {
        addTarget("pub", dir);
      } else if (pm.name === "mix") {
        addTarget("mix", dir);
      }
    }
  }

  // Also inspect Runtime evidence for package manifests
  for (const rt of state.runtime) {
    for (const ev of rt.evidence) {
      const dir = getDir(ev.source);
      const lower = ev.source.toLowerCase();
      if (lower.endsWith("package.json")) {
        addTarget("npm", dir);
      } else if (lower.endsWith("cargo.toml")) {
        addTarget("cargo", dir);
      } else if (lower.endsWith("requirements.txt") || lower.endsWith("pipfile") || lower.endsWith("pyproject.toml")) {
        addTarget("pip", dir);
      } else if (lower.endsWith("go.mod")) {
        addTarget("gomod", dir);
      } else if (lower.endsWith("pom.xml")) {
        addTarget("maven", dir);
      } else if (lower.endsWith("build.gradle") || lower.endsWith("build.gradle.kts")) {
        addTarget("gradle", dir);
      } else if (lower.endsWith(".csproj") || lower.endsWith(".sln")) {
        addTarget("nuget", dir);
      } else if (lower.endsWith("gemfile")) {
        addTarget("bundler", dir);
      } else if (lower.endsWith("composer.json")) {
        addTarget("composer", dir);
      } else if (lower.endsWith("pubspec.yaml")) {
        addTarget("pub", dir);
      } else if (lower.endsWith("mix.exs")) {
        addTarget("mix", dir);
      }
    }
  }

  // Check Infrastructure (Docker)
  const dockerfiles: string[] = [];
  for (const infra of state.infrastructure) {
    if (infra.name === "docker") {
      for (const ev of infra.evidence) {
        if (ev.source.toLowerCase().includes("dockerfile")) {
          const dir = getDir(ev.source);
          addTarget("docker", dir);
          dockerfiles.push(ev.source.replace(/\\/g, "/"));
        }
      }
    }
  }

  // 2. Resolve Native Audits with auto-installation and monorepo directory traversal
  const nativeAudits: NativeAuditConfig[] = [];
  const runtimes = state.runtime.map(r => r.name);

  if (runtimes.includes("rust")) {
    nativeAudits.push({
      tool: "cargo-audit",
      command: "cargo install cargo-audit --locked || true && cargo audit",
      failOnError: blockOnVulnerabilities
    });
  }

  if (runtimes.includes("node")) {
    const isPnpm = state.packageManager.some(p => p.name === "pnpm");
    const isYarn = state.packageManager.some(p => p.name === "yarn");
    const cmd = isPnpm
      ? "pnpm audit"
      : isYarn
      ? "yarn audit"
      : "if [ -f package-lock.json ]; then npm audit --audit-level=high; else for dir in $(find . -name 'package-lock.json' -not -path '*/node_modules/*' -exec dirname {} \\;); do (cd \"$dir\" && echo \"Auditing $dir...\" && npm audit --audit-level=high); done; fi";
    nativeAudits.push({
      tool: "npm-audit",
      command: cmd,
      failOnError: blockOnVulnerabilities
    });
  }

  if (runtimes.includes("python")) {
    nativeAudits.push({
      tool: "pip-audit",
      command: "pip install pip-audit && if [ -f requirements.txt ]; then pip-audit -r requirements.txt; else for req in $(find . -name 'requirements.txt' -not -path '*/.*'); do echo \"Auditing $req...\" && pip-audit -r \"$req\"; done; fi",
      failOnError: blockOnVulnerabilities
    });
  }

  if (runtimes.includes("go")) {
    nativeAudits.push({
      tool: "govulncheck",
      command: "go install golang.org/x/vuln/cmd/govulncheck@latest && if [ -f go.mod ]; then govulncheck ./...; else for mod in $(find . -name 'go.mod' -not -path '*/.*'); do (cd \"$(dirname \"$mod\")\" && echo \"Auditing $(dirname \"$mod\")...\" && govulncheck ./...); done; fi",
      failOnError: blockOnVulnerabilities
    });
  }

  // 3. Resolve CodeQL Languages (CodeQL is enabled for Standard and Strict)
  const codeqlLanguages: CodeQLLanguage[] = [];
  if (level === "standard" || level === "strict") {
    if (runtimes.includes("node")) codeqlLanguages.push("javascript-typescript");
    if (runtimes.includes("python")) codeqlLanguages.push("python");
    if (runtimes.includes("go")) codeqlLanguages.push("go");
    if (runtimes.includes("java")) codeqlLanguages.push("java-kotlin");
    if (runtimes.includes("dotnet")) codeqlLanguages.push("csharp");
    if (runtimes.includes("ruby")) codeqlLanguages.push("ruby");
    if (runtimes.includes("cpp")) codeqlLanguages.push("c-cpp");
    if (runtimes.includes("swift")) codeqlLanguages.push("swift");
  }

  // 4. Resolve Specialized Code Scanning Tools
  const scanners: CodeScanningTargetConfig[] = [];
  if (level === "standard" || level === "strict") {
    // Dockerfile linting
    if (dockerfiles.length > 0) {
      scanners.push({
        tool: "hadolint",
        targetPath: dockerfiles[0],
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Python Security Linter (Bandit)
    if (runtimes.includes("python")) {
      scanners.push({
        tool: "bandit",
        failOnError: blockOnVulnerabilities,
        uploadSarif: false
      });
    }

    // Ruby / Rails (Brakeman)
    if (runtimes.includes("ruby") || state.frameworks.some(f => f.name === "rails")) {
      scanners.push({
        tool: "brakeman",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Node.js (njsscan)
    if (runtimes.includes("node")) {
      scanners.push({
        tool: "njsscan",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Rust Security & Linter (Clippy)
    if (runtimes.includes("rust")) {
      scanners.push({
        tool: "clippy",
        failOnError: blockOnVulnerabilities,
        uploadSarif: false
      });
    }

    // C / C++ SAST (Flawfinder)
    if (runtimes.includes("cpp")) {
      scanners.push({
        tool: "flawfinder",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Elixir / Phoenix SAST (Sobelow)
    if (runtimes.includes("elixir") || state.frameworks.some(f => f.name === "phoenix")) {
      scanners.push({
        tool: "sobelow",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Java / Kotlin / Scala SAST (Xanitizer)
    if (runtimes.includes("java") || runtimes.includes("scala")) {
      scanners.push({
        tool: "xanitizer",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Kubernetes Security Analysis (Kubesec)
    if (state.infrastructure.some(i => i.name === "kubernetes")) {
      scanners.push({
        tool: "kubesec",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // PR Dependency Review
    scanners.push({
      tool: "dependency-review",
      failOnError: blockOnVulnerabilities,
      uploadSarif: false
    });

    // OSV-Scanner for open-source CVEs
    scanners.push({
      tool: "osv-scanner",
      failOnError: blockOnVulnerabilities,
      uploadSarif: true
    });

    // Terraform & IaC Scanning (tfsec + Zscaler)
    if (state.infrastructure.some(i => i.name === "terraform")) {
      scanners.push({
        tool: "tfsec",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
      scanners.push({
        tool: "zscaler-iac",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }

    // Dynamic API Security Testing (StackHawk)
    const hasStackhawk =
      state.tooling.some(t => t.name === "stackhawk" || t.evidence.some(e => e.source.includes("stackhawk"))) ||
      state.infrastructure.some(i => i.evidence.some(e => e.source.includes("stackhawk")));
    if (hasStackhawk) {
      scanners.push({
        tool: "stackhawk",
        failOnError: blockOnVulnerabilities,
        uploadSarif: false
      });
    }
  }

  // Strict Mode: Add Universal SAST (Semgrep), Supply Chain (Scorecard), and Anchore Grype
  if (level === "strict") {
    scanners.push({
      tool: "semgrep",
      failOnError: blockOnVulnerabilities,
      uploadSarif: true
    });

    scanners.push({
      tool: "scorecard",
      failOnError: false, // Scorecard reports supply chain posture without failing builds
      uploadSarif: true
    });

    if (dockerfiles.length > 0) {
      scanners.push({
        tool: "anchore",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
      scanners.push({
        tool: "sysdig",
        failOnError: blockOnVulnerabilities,
        uploadSarif: true
      });
    }
  }


  // 5. Resolve Container Scanning
  const enableContainerScanning = (level === "standard" || level === "strict") && dockerfiles.length > 0;
  const severityThreshold = level === "strict" ? "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL" : "HIGH,CRITICAL";

  // 6. Resolve Secret Scanning (Strict level only)
  const enableSecretScanning = level === "strict";

  return {
    level,
    dependabot: {
      enabled: dependabotTargets.length > 0,
      ecosystems: dependabotTargets
    },
    nativeAudits,
    codeql: {
      enabled: codeqlLanguages.length > 0,
      languages: codeqlLanguages,
      scheduleCron: level === "strict" ? "0 0 * * 1,4" : "0 0 * * 1"
    },
    codeScanning: {
      enabled: scanners.length > 0,
      scanners
    },
    containerScanning: {
      enabled: enableContainerScanning,
      dockerfiles,
      severityThreshold,
      uploadSarif: level === "strict"
    },
    secretScanning: {
      enabled: enableSecretScanning,
      tool: "harden-runner"
    },
    enforcement: {
      blockOnVulnerabilities
    }
  };
}


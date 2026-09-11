import type { Rule } from "../types.js";
import { findCapability, formatEvidence, noMatch } from "./helpers.js";
import { ALL_PLUGINS, type AutoGhaPlugin } from "@auto-gha/registry";

const RULE_ID_MAP: Record<string, string> = {
  node: "node-setup",
  python: "python-test",
  go: "go-build",
  rust: "rust-build",
  java: "java-ci",
  dotnet: "dotnet-ci",
  ruby: "ruby-ci",
  php: "php-ci",
  dart: "dart-ci",
  elixir: "elixir-ci",
  cpp: "cpp-ci",
  deno: "deno-ci",
  swift: "swift-ci",
  docker: "docker-build",
  aws: "deploy-aws",
  gcp: "deploy-gcp",
  azure: "deploy-azure",
  kubernetes: "deploy-k8s",
  terraform: "deploy-terraform",
  ghcr: "deploy-ghcr"
};

export function generateRulesFromPlugins(): Rule[] {
  const rules: Rule[] = [];

  for (const plugin of ALL_PLUGINS) {
    if (plugin.type === "language") {
      rules.push(createLanguageRule(plugin));
    } else if (plugin.type === "infrastructure") {
      rules.push(createInfrastructureRule(plugin));
    } else if (plugin.type === "deployment") {
      rules.push(createDeploymentRule(plugin));
    }
  }

  return rules;
}

function createLanguageRule(plugin: AutoGhaPlugin): Rule {
  const ruleId = RULE_ID_MAP[plugin.id] ?? `${plugin.id}-rule`;

  return {
    id: ruleId,
    description: `Configure ${plugin.name} execution when ${plugin.name} runtime is detected.`,
    evaluate(state, capabilities) {
      const cap = findCapability(capabilities, `runtime.${plugin.id}` as any);
      if (!cap) return noMatch();

      const actions: any[] = [];

      if (plugin.id === "node") {
        const isPnpm = findCapability(capabilities, "package.pnpm");
        const isYarn = findCapability(capabilities, "package.yarn");
        const isBun = findCapability(capabilities, "package.bun");

        if (isPnpm) {
          actions.push({
            id: "pnpm-setup",
            type: "dependency.install",
            inputs: { packageManager: "pnpm" },
            reason: "pnpm package manager detected.",
            sourceRule: "node-setup"
          });
        }

        actions.push({
          id: "node-setup",
          type: "runtime.setup",
          inputs: {
            runtime: "node",
            version: cap.version ?? "20.x"
          },
          reason: "Node.js runtime detected.",
          sourceRule: "node-setup"
        });

        const installCmd = isPnpm
          ? "if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi"
          : isYarn
          ? "if [ -f yarn.lock ]; then yarn install --immutable; else yarn install; fi"
          : isBun
          ? "bun install --frozen-lockfile || bun install"
          : "if [ -f package.json ]; then if [ -f package-lock.json ]; then npm ci; else npm install; fi; fi; for dir in $(find . -name 'package.json' -not -path '*/node_modules/*' -not -path './package.json' -exec dirname {} \\;); do if [ -f \"$dir/package-lock.json\" ]; then (cd \"$dir\" && npm ci); else (cd \"$dir\" && npm install); fi; done";

        actions.push({
          id: "node-install",
          type: "dependency.install",
          inputs: {
            packageManager: isPnpm ? "pnpm-cmd" : isYarn ? "yarn-cmd" : isBun ? "bun-cmd" : "npm-cmd",
            customCommand: installCmd
          },
          reason: "Install Node.js dependencies across root and monorepo packages.",
          sourceRule: "node-setup"
        });

        const testCmd = isPnpm
          ? "pnpm test --if-present"
          : isYarn
          ? "yarn test"
          : isBun
          ? "bun test"
          : "if [ -f package.json ]; then npm test --if-present; fi; for dir in $(find . -name 'package.json' -not -path '*/node_modules/*' -not -path './package.json' -exec dirname {} \\;); do (cd \"$dir\" && npm test --if-present); done";

        actions.push({
          id: "node-test",
          type: "test.unit",
          inputs: {
            framework: "npm-test",
            customCommand: testCmd
          },
          reason: "Run Node.js tests if present across workspace.",
          sourceRule: "node-setup"
        });
      } else if (plugin.id === "go") {
        actions.push(
          {
            id: "go-build",
            type: "go.build",
            reason: "Compile Go packages.",
            sourceRule: "go-build"
          },
          {
            id: "go-test",
            type: "go.test",
            reason: "Execute Go test suite.",
            sourceRule: "go-build"
          }
        );
      } else if (plugin.id === "python") {
        actions.push({
          id: "python-test",
          type: "python.test",
          reason: "Python runtime detected.",
          sourceRule: "python-test"
        });
      } else if (plugin.id === "rust") {
        actions.push(
          {
            id: "rust-build",
            type: "rust.build",
            reason: "Compile Rust workspace/crates.",
            sourceRule: "rust-build"
          },
          {
            id: "rust-test",
            type: "rust.test",
            reason: "Execute Rust unit and integration tests.",
            sourceRule: "rust-build"
          }
        );
      } else if (plugin.id === "java") {
        const isMaven = findCapability(capabilities, "package.maven");
        const isGradle = findCapability(capabilities, "package.gradle");

        actions.push({
          id: "java-setup",
          type: "runtime.setup",
          inputs: {
            runtime: "java",
            version: cap.version ?? "17"
          },
          reason: "Java JDK setup.",
          sourceRule: "java-ci"
        });

        if (isGradle) {
          actions.push({
            id: "gradle-build",
            type: "java.build",
            inputs: { tool: "gradle" },
            reason: "Build and test with Gradle.",
            sourceRule: "java-ci"
          });
        } else if (isMaven) {
          actions.push({
            id: "maven-build",
            type: "java.build",
            inputs: { tool: "maven" },
            reason: "Build and test with Maven.",
            sourceRule: "java-ci"
          });
        } else {
          actions.push({
            id: "javac-build",
            type: "java.build",
            inputs: { tool: "javac" },
            reason: "Compile standalone Java files with javac.",
            sourceRule: "java-ci"
          });
        }
      } else if (plugin.id === "dotnet") {
        actions.push(
          {
            id: "dotnet-setup",
            type: "runtime.setup",
            inputs: {
              runtime: "dotnet",
              version: cap.version ?? "8.0.x"
            },
            reason: ".NET SDK setup.",
            sourceRule: "dotnet-ci"
          },
          {
            id: "dotnet-build",
            type: "dotnet.build",
            reason: "Restore and build .NET solution/project.",
            sourceRule: "dotnet-ci"
          },
          {
            id: "dotnet-test",
            type: "dotnet.test",
            reason: "Execute .NET unit tests.",
            sourceRule: "dotnet-ci"
          }
        );
      } else {
        if (plugin.provides.includes("setup")) {
          actions.push({
            id: `${plugin.id}-setup`,
            type: "runtime.setup",
            inputs: {
              runtime: plugin.id,
              version: cap.version
            },
            reason: `${plugin.name} runtime setup.`,
            sourceRule: `${plugin.id}-ci`
          });
        }
        if (plugin.provides.includes("build")) {
          actions.push({
            id: `${plugin.id}-build`,
            type: `${plugin.id}.build`,
            reason: `Build ${plugin.name} application.`,
            sourceRule: `${plugin.id}-ci`
          });
        }
        if (plugin.provides.includes("test")) {
          actions.push({
            id: `${plugin.id}-test`,
            type: `${plugin.id}.test`,
            reason: `Execute ${plugin.name} test suite.`,
            sourceRule: `${plugin.id}-ci`
          });
        }
      }

      return {
        matched: true,
        actions,
        reasons: [`${plugin.name} runtime detected.`, ...formatEvidence(cap)]
      };
    }
  };
}

function createInfrastructureRule(plugin: AutoGhaPlugin): Rule {
  const ruleId = RULE_ID_MAP[plugin.id] ?? `${plugin.id}-rule`;

  return {
    id: ruleId,
    description: `Configure ${plugin.name} infrastructure actions.`,
    evaluate(_state, capabilities) {
      if (plugin.id === "docker") {
        const docker = findCapability(capabilities, "infra.docker");
        const compose = findCapability(capabilities, "infra.docker-compose");
        if (!docker && !compose) return noMatch();

        const dockerfile = docker?.evidence?.[0]?.source ?? "Dockerfile";
        return {
          matched: true,
          actions: [
            {
              id: "docker-build",
              type: "docker.build",
              inputs: { file: dockerfile, context: "." },
              reason: "Docker infrastructure detected.",
              sourceRule: "docker-build"
            }
          ],
          reasons: ["Docker infrastructure detected.", ...formatEvidence(docker, compose)]
        };
      }
      return noMatch();
    }
  };
}

function createDeploymentRule(plugin: AutoGhaPlugin): Rule {
  const ruleId = RULE_ID_MAP[plugin.id] ?? `deploy-${plugin.id}`;

  return {
    id: ruleId,
    description: `Deploy application using ${plugin.name}.`,
    evaluate(_state, capabilities) {
      if (plugin.id === "aws") {
        const awsCap = findCapability(capabilities, "infra.aws");
        if (!awsCap) return noMatch();
        return {
          matched: true,
          actions: [
            {
              id: "deploy-aws-ecs",
              type: "deploy.aws",
              inputs: { registry: "ecr", service: "ecs" },
              reason: "AWS deployment markers detected.",
              sourceRule: "deploy-aws"
            }
          ],
          reasons: ["AWS infrastructure detected.", ...formatEvidence(awsCap)]
        };
      }
      if (plugin.id === "gcp") {
        const gcpCap = findCapability(capabilities, "infra.gcp");
        if (!gcpCap) return noMatch();
        return {
          matched: true,
          actions: [
            {
              id: "deploy-gcp-cloudrun",
              type: "deploy.gcp",
              inputs: { service: "cloudrun" },
              reason: "GCP deployment markers detected.",
              sourceRule: "deploy-gcp"
            }
          ],
          reasons: ["GCP infrastructure detected.", ...formatEvidence(gcpCap)]
        };
      }
      if (plugin.id === "azure") {
        const azureCap = findCapability(capabilities, "infra.azure");
        if (!azureCap) return noMatch();
        return {
          matched: true,
          actions: [
            {
              id: "deploy-azure-app",
              type: "deploy.azure",
              inputs: { service: "webapp" },
              reason: "Azure deployment markers detected.",
              sourceRule: "deploy-azure"
            }
          ],
          reasons: ["Azure infrastructure detected.", ...formatEvidence(azureCap)]
        };
      }
      if (plugin.id === "kubernetes") {
        const k8sCap = findCapability(capabilities, "infra.kubernetes");
        if (!k8sCap) return noMatch();
        return {
          matched: true,
          actions: [
            {
              id: "deploy-k8s-cluster",
              type: "deploy.kubernetes",
              inputs: { tool: "helm" },
              reason: "Kubernetes/Helm manifests detected.",
              sourceRule: "deploy-k8s"
            }
          ],
          reasons: ["Kubernetes infrastructure detected.", ...formatEvidence(k8sCap)]
        };
      }
      if (plugin.id === "terraform") {
        const tfCap = findCapability(capabilities, "infra.terraform");
        if (!tfCap) return noMatch();
        return {
          matched: true,
          actions: [
            {
              id: "deploy-terraform-apply",
              type: "deploy.terraform",
              inputs: { tool: "terraform" },
              reason: "Terraform configuration files detected.",
              sourceRule: "deploy-terraform"
            }
          ],
          reasons: ["Terraform infrastructure detected.", ...formatEvidence(tfCap)]
        };
      }
      if (plugin.id === "ghcr") {
        const dockerCap = findCapability(capabilities, "infra.docker");
        if (!dockerCap) return noMatch();
        const dockerfile = dockerCap?.evidence?.[0]?.source ?? "Dockerfile";
        return {
          matched: true,
          actions: [
            {
              id: "deploy-ghcr-image",
              type: "deploy.ghcr",
              inputs: { registry: "ghcr.io", file: dockerfile, context: "." },
              reason: "Dockerfile detected with container deployment intent.",
              sourceRule: "deploy-ghcr"
            }
          ],
          reasons: ["Docker infrastructure detected.", ...formatEvidence(dockerCap)]
        };
      }
      return noMatch();
    }
  };
}

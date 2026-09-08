import type { ProjectState } from "@auto-gha/state";
import type { SecurityLevel, SecurityPolicyIR, GeneratedSecurityArtifacts } from "./types.js";
import { resolveSecurityPolicy } from "./resolver.js";
import { compileDependabotYAML } from "./compilers/dependabot.js";
import { compileCodeQLYAML } from "./compilers/codeql.js";
import { compileSecurityWorkflowYAML } from "./compilers/audit.js";
import { compileCodeScanningWorkflowYAML } from "./compilers/code-scanning.js";

export * from "./types.js";
export * from "./resolver.js";
export * from "./compilers/dependabot.js";
export * from "./compilers/codeql.js";
export * from "./compilers/audit.js";
export * from "./compilers/code-scanning.js";

export function compileSecurityArtifacts(
  policy: SecurityPolicyIR
): GeneratedSecurityArtifacts {
  if (policy.level === "none") {
    return { policy };
  }

  const dependabotYaml = compileDependabotYAML(policy);
  const codeqlYaml = compileCodeQLYAML(policy);
  const securityWorkflowYaml = compileSecurityWorkflowYAML(policy);
  const codeScanningYaml = compileCodeScanningWorkflowYAML(policy);

  return {
    policy,
    dependabotYaml: dependabotYaml || undefined,
    codeqlYaml: codeqlYaml || undefined,
    securityWorkflowYaml: securityWorkflowYaml || undefined,
    codeScanningYaml: codeScanningYaml || undefined
  };
}

export function compileSecurityPolicy(
  state: ProjectState,
  level: SecurityLevel = "standard"
): GeneratedSecurityArtifacts {
  const policy = resolveSecurityPolicy(state, level);
  return compileSecurityArtifacts(policy);
}


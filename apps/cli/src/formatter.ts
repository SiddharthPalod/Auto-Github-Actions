import type { ProjectState } from "@auto-gha/state";
import type { WorkflowPlan } from "@auto-gha/planner";
import type { ResolvedWorkflowPlan } from "@auto-gha/resolver";
import type { WorkflowIR } from "@auto-gha/workflow-ir";
import type { GeneratedSecurityArtifacts } from "@auto-gha/security";

export function printScanResults(
  target: string,
  state: ProjectState,
  plan: WorkflowPlan,
  resolved?: ResolvedWorkflowPlan,
  ir?: WorkflowIR,
  compiledYaml?: string,
  security?: GeneratedSecurityArtifacts
): void {
  console.log(`\nScanning Target: ${target}\n`);

  console.log("=== PROJECT STATE ===");
  console.log(JSON.stringify(state, null, 2));

  console.log("\n=== CAPABILITIES ===");
  for (const capability of plan.capabilities) {
    const versionStr = capability.version ? ` (v${capability.version})` : "";
    console.log(`✓ ${capability.id}${versionStr} [confidence: ${capability.confidence}]`);
    for (const evidence of capability.evidence) {
      console.log(`  evidence: ${evidence.source} → ${evidence.reason}`);
    }
  }

  console.log("\n=== MATCHED RULES ===");
  for (const rule of plan.matchedRules) {
    console.log(`✓ ${rule}`);
  }

  console.log("\n=== PLANNED ACTIONS ===");
  for (const action of plan.actions) {
    console.log(`→ ${action.id}: ${action.type}`);
    console.log(`  reason: ${action.reason}`);
  }

  if (resolved && resolved.primitives.length > 0) {
    console.log("\n=== RESOLVED GITHUB ACTIONS ===");
    for (const primitive of resolved.primitives) {
      if (primitive.kind === "uses") {
        console.log(`→ uses: ${primitive.uses}`);
        if (primitive.with) {
          console.log(`  with: ${JSON.stringify(primitive.with)}`);
        }
      } else if (primitive.kind === "run") {
        console.log(`→ run: ${primitive.run}`);
      }
      console.log(`  reason: ${primitive.reason}`);
      console.log(`  source: ${primitive.source}`);
    }
    for (const warning of resolved.warnings) {
      console.warn(`⚠ ${warning}`);
    }
  }

  if (ir) {
    console.log("\n=== TYPED WORKFLOW IR (STRUCTURAL DAG) ===");
    console.log(`Workflow: ${ir.name}`);
    console.log(`Triggers: ${ir.triggers.map(t => t.event).join(", ")}`);
    console.log(`Jobs (${ir.jobs.length}):`);
    for (const job of ir.jobs) {
      const needsStr = job.needs && job.needs.length > 0 ? ` (needs: [${job.needs.join(", ")}])` : "";
      console.log(`  ┌─ Job [${job.id}] "${job.name ?? job.id}" on ${job.runsOn}${needsStr}`);
      for (const step of job.steps) {
        const stepDesc = step.kind === "uses" ? `uses: ${step.uses}` : `run: ${step.run}`;
        const sourceStr = step.source ? ` [from: ${step.source}]` : "";
        console.log(`  │  ├─ ${stepDesc}${sourceStr}`);
      }
      console.log(`  └───────────────────────────────────────────────`);
    }
  }

  if (compiledYaml) {
    console.log("\n=== COMPILED GITHUB ACTIONS YAML (.github/workflows/ci.yml) ===");
    console.log(compiledYaml);
  }

  if (security) {
    console.log("\n=== SECURITY POLICY COMPILER (Level: " + security.policy.level + ") ===");
    console.log(`Dependabot targets: ${security.policy.dependabot.ecosystems.length}`);
    console.log(`CodeQL languages: ${security.policy.codeql.languages.join(", ") || "none"}`);
    console.log(`Native audits: ${security.policy.nativeAudits.map(a => a.tool).join(", ") || "none"}`);
    console.log(`Container scanning: ${security.policy.containerScanning.enabled ? "enabled" : "disabled"}`);

    if (security.dependabotYaml) {
      console.log("\n--- .github/dependabot.yml ---");
      console.log(security.dependabotYaml);
    }
    if (security.codeqlYaml) {
      console.log("\n--- .github/workflows/codeql.yml ---");
      console.log(security.codeqlYaml);
    }
    if (security.securityWorkflowYaml) {
      console.log("\n--- .github/workflows/security.yml ---");
      console.log(security.securityWorkflowYaml);
    }
  }

  if (plan.diagnostics.length > 0) {
    console.log("\n=== DIAGNOSTICS ===");
    for (const diagnostic of plan.diagnostics) {
      console.log(`• ${diagnostic}`);
    }
  }
}

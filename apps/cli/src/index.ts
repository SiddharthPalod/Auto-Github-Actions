#!/usr/bin/env node
import { scanRepository } from "@zcicd/scanner";
import { planWorkflow } from "@zcicd/planner";
import { resolvePlan } from "@zcicd/resolver";
import { buildWorkflowIR, compileWorkflowYAML } from "@zcicd/compiler";
import { compileSecurityPolicy } from "@zcicd/security";
import { withRepository } from "./git.js";
import { printScanResults } from "./formatter.js";
import { runInteractiveWizard as runWizardV1 } from "./wizard.js";
import { runInteractiveWizardV2 as runWizardV2 } from "./wizard2.js";

const args = process.argv.slice(2);

// Options
const isInspectMode = args.includes("--inspect") || args.includes("--print");
const isV1 = args.includes("--v1");
const targetArg = args.find(arg => !arg.startsWith("-"));

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Auto GitHub Actions (auto-gha)

Usage:
  auto-gha [options] [path|url]

Options:
  --v2                 Run Wizard v2 (Live compiler pipeline with rich animations - Default)
  --v1                 Run Wizard v1 (Minimalist fast wizard)
  --inspect, --print   Run non-interactive inspection and print state, IR, YAML, and security to stdout
  --help, -h          Show this help message

Examples:
  auto-gha
  auto-gha --v1
  auto-gha ./my-project
  auto-gha --inspect https://github.com/expressjs/express
`);
  process.exit(0);
}

if (!isInspectMode && !targetArg) {
  // Interactive Wizard Modes
  if (isV1) {
    await runWizardV1();
  } else {
    await runWizardV2();
  }
} else {
  // Direct / Inspect Mode
  const target = targetArg ?? ".";
  try {
    await withRepository(target, async (scanPath) => {
      const state = await scanRepository(scanPath);
      const plan = planWorkflow(state);
      const resolvedPlan = resolvePlan(plan);
      const ir = buildWorkflowIR(plan, resolvedPlan);
      const compiledYaml = compileWorkflowYAML(ir, {
        state,
        plan,
        resolved: resolvedPlan
      });
      const security = compileSecurityPolicy(state, "standard");
      printScanResults(target, state, plan, resolvedPlan, ir, compiledYaml, security);
    });
  } catch (error) {
    console.error("\n[Error] Failed to scan, plan, or compile repository:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
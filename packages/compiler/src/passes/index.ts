export * from "./types.js";
export * from "./caching.js";
export * from "./hardening.js";
export * from "./matrix.js";

import type { WorkflowIR } from "@auto-gha/workflow-ir";
import type { CompilerContext, CompilerPass } from "./types.js";
import { dependencyCachingPass } from "./caching.js";
import { productionHardeningPass } from "./hardening.js";
import { matrixTestingPass } from "./matrix.js";

export const DEFAULT_OPTIMIZATION_PASSES: CompilerPass[] = [
  dependencyCachingPass,
  productionHardeningPass,
  matrixTestingPass
];

export function runOptimizationPasses(
  ir: WorkflowIR,
  context: CompilerContext,
  passes: CompilerPass[] = DEFAULT_OPTIMIZATION_PASSES
): WorkflowIR {
  let currentIR = ir;
  for (const pass of passes) {
    currentIR = pass.transform(currentIR, context);
  }
  return currentIR;
}


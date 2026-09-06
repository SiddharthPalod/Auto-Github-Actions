import type { WorkflowIR } from "@auto-gha/workflow-ir";
import type { ProjectState } from "@auto-gha/state";
import type { WorkflowPlan } from "@auto-gha/planner";
import type { ResolvedWorkflowPlan } from "@auto-gha/resolver";

export type OptimizationOptions = {
  enableCaching?: boolean;
  enableHardening?: boolean;
  enableConcurrency?: boolean;
  enablePathFiltering?: boolean;
  defaultTimeoutMinutes?: number;
  matrixVersions?: {
    node?: string[];
    python?: string[];
    go?: string[];
  };
};

export type CompilerContext = {
  state?: ProjectState;
  plan?: WorkflowPlan;
  resolved?: ResolvedWorkflowPlan;
  options?: OptimizationOptions;
};

export interface CompilerPass {
  readonly name: string;
  readonly description: string;
  transform(ir: WorkflowIR, context: CompilerContext): WorkflowIR;
}


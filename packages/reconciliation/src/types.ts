import type { WorkflowIR, WorkflowJob, WorkflowStep } from "@auto-gha/workflow-ir";

export type ReconciliationStatus = "create" | "identical" | "upgrade" | "conflict";

export type JobDiffType = "added" | "removed" | "modified" | "unchanged";
export type StepDiffType = "added" | "removed" | "modified" | "preserved" | "unchanged";

export type StepDiff = {
  type: StepDiffType;
  step: WorkflowStep;
  reason?: string;
};

export type JobDiff = {
  jobId: string;
  type: JobDiffType;
  existingJob?: WorkflowJob;
  desiredJob?: WorkflowJob;
  stepDiffs: StepDiff[];
};

export type ReconciliationPlan = {
  status: ReconciliationStatus;
  jobDiffs: JobDiff[];
  summary: string;
  mergedIR: WorkflowIR;
  customStepsPreserved: number;
};


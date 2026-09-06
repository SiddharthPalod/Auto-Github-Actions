import { parse } from "yaml";
import type { WorkflowIR, WorkflowJob, WorkflowStep } from "@auto-gha/workflow-ir";
import type { ReconciliationPlan, JobDiff, StepDiff, ReconciliationStatus } from "./types.js";

function parseExistingWorkflow(yamlContent: string): { name?: string; jobs: Record<string, any> } | null {
  try {
    const doc = parse(yamlContent);
    if (!doc || typeof doc !== "object" || !doc.jobs) {
      return null;
    }
    return doc;
  } catch {
    return null;
  }
}

function normalizeStepKey(step: any): string {
  if (step.uses) {
    const actionName = step.uses.split("@")[0];
    return `uses:${actionName}`;
  }
  if (step.run) {
    const firstLine = step.run.trim().split("\n")[0];
    return `run:${firstLine}`;
  }
  return `unknown:${JSON.stringify(step)}`;
}

export function reconcileWorkflows(
  existingYaml: string | null | undefined,
  desiredIR: WorkflowIR
): ReconciliationPlan {
  if (!existingYaml || existingYaml.trim() === "") {
    const jobDiffs: JobDiff[] = desiredIR.jobs.map(job => ({
      jobId: job.id,
      type: "added",
      desiredJob: job,
      stepDiffs: job.steps.map(s => ({ type: "added", step: s }))
    }));

    return {
      status: "create",
      jobDiffs,
      summary: `Create new workflow with ${desiredIR.jobs.length} jobs (${desiredIR.jobs.map(j => j.id).join(", ")})`,
      mergedIR: desiredIR,
      customStepsPreserved: 0
    };
  }

  const existingDoc = parseExistingWorkflow(existingYaml);
  if (!existingDoc) {
    // Malformed existing YAML - fall back to replacement
    return {
      status: "conflict",
      jobDiffs: [],
      summary: "Existing workflow YAML could not be parsed. Overwriting with clean generated AST.",
      mergedIR: desiredIR,
      customStepsPreserved: 0
    };
  }

  const existingJobs = existingDoc.jobs || {};
  const jobDiffs: JobDiff[] = [];
  const mergedJobs: WorkflowJob[] = [];
  let customStepsPreservedCount = 0;
  let hasModifications = false;
  let hasAdditions = false;

  for (const desiredJob of desiredIR.jobs) {
    const existingJob = existingJobs[desiredJob.id];

    if (!existingJob) {
      // Job was added
      hasAdditions = true;
      jobDiffs.push({
        jobId: desiredJob.id,
        type: "added",
        desiredJob,
        stepDiffs: desiredJob.steps.map(s => ({ type: "added", step: s }))
      });
      mergedJobs.push(desiredJob);
      continue;
    }

    // Job exists in both - reconcile steps
    const existingSteps: any[] = Array.isArray(existingJob.steps) ? existingJob.steps : [];
    const stepDiffs: StepDiff[] = [];
    const finalSteps: WorkflowStep[] = [];

    const desiredStepKeys = new Set(desiredJob.steps.map(s => normalizeStepKey(s)));
    const existingStepKeys = new Set(existingSteps.map(s => normalizeStepKey(s)));

    // 1. Add/Update desired compiler steps
    for (const step of desiredJob.steps) {
      const key = normalizeStepKey(step);
      if (existingStepKeys.has(key)) {
        stepDiffs.push({ type: "unchanged", step });
      } else {
        hasModifications = true;
        stepDiffs.push({ type: "added", step, reason: "Injected by compiler" });
      }
      finalSteps.push(step);
    }

    // 2. Preserve custom user steps found in existing workflow that the compiler doesn't manage
    for (const rawStep of existingSteps) {
      const key = normalizeStepKey(rawStep);
      if (!desiredStepKeys.has(key)) {
        // This is a custom user-defined step (e.g. deployment, notifications, custom scripts)
        const preservedStep: WorkflowStep = rawStep.uses
          ? {
              kind: "uses",
              name: rawStep.name,
              uses: rawStep.uses,
              with: rawStep.with,
              source: "user-preserved"
            }
          : {
              kind: "run",
              name: rawStep.name,
              run: rawStep.run,
              env: rawStep.env,
              workingDirectory: rawStep["working-directory"],
              source: "user-preserved"
            };

        stepDiffs.push({
          type: "preserved",
          step: preservedStep,
          reason: "User custom step preserved during reconciliation"
        });
        finalSteps.push(preservedStep);
        customStepsPreservedCount++;
      }
    }

    const jobType = stepDiffs.some(d => d.type === "added" || d.type === "preserved") ? "modified" : "unchanged";
    jobDiffs.push({
      jobId: desiredJob.id,
      type: jobType,
      existingJob: {
        id: desiredJob.id,
        name: existingJob.name,
        runsOn: existingJob["runs-on"] || "ubuntu-latest",
        steps: existingSteps
      },
      desiredJob,
      stepDiffs
    });

    mergedJobs.push({
      ...desiredJob,
      steps: finalSteps
    });
  }

  // Determine status
  let status: ReconciliationStatus = "identical";
  if (hasAdditions || hasModifications || customStepsPreservedCount > 0) {
    status = "upgrade";
  }

  const mergedIR: WorkflowIR = {
    ...desiredIR,
    jobs: mergedJobs
  };

  const summaryParts: string[] = [];
  if (hasAdditions) summaryParts.push("Added new parallel jobs");
  if (hasModifications) summaryParts.push("Upgraded step caching & hardening");
  if (customStepsPreservedCount > 0) summaryParts.push(`Preserved ${customStepsPreservedCount} custom user steps`);
  if (summaryParts.length === 0) summaryParts.push("Workflow is up to date");

  return {
    status,
    jobDiffs,
    summary: summaryParts.join(" | "),
    mergedIR,
    customStepsPreserved: customStepsPreservedCount
  };
}


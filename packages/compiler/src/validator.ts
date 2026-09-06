import type { WorkflowIR } from "@auto-gha/workflow-ir";

export type ValidationError = {
  path: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

export function validateWorkflowIR(ir: WorkflowIR): ValidationResult {
  const errors: ValidationError[] = [];

  if (!ir.name || ir.name.trim() === "") {
    errors.push({ path: "name", message: "Workflow must have a non-empty name." });
  }

  if (!ir.triggers || ir.triggers.length === 0) {
    errors.push({ path: "triggers", message: "Workflow must specify at least one trigger." });
  }

  if (!ir.jobs || ir.jobs.length === 0) {
    errors.push({ path: "jobs", message: "Workflow must contain at least one job." });
  }

  const jobIds = new Set<string>();
  for (const job of ir.jobs) {
    if (jobIds.has(job.id)) {
      errors.push({ path: `jobs.${job.id}`, message: `Duplicate job ID: "${job.id}".` });
    }
    jobIds.add(job.id);

    if (!job.steps || job.steps.length === 0) {
      errors.push({ path: `jobs.${job.id}.steps`, message: `Job "${job.id}" must contain at least one step.` });
    }

    if (!job.runsOn || job.runsOn.trim() === "") {
      errors.push({ path: `jobs.${job.id}.runsOn`, message: `Job "${job.id}" must specify runsOn.` });
    }

    if (job.needs) {
      for (const need of job.needs) {
        if (!ir.jobs.some(j => j.id === need)) {
          errors.push({
            path: `jobs.${job.id}.needs`,
            message: `Job "${job.id}" depends on non-existent job "${need}".`
          });
        }
      }
    }
  }

  // Check for DAG cycles in job dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(jobId: string): boolean {
    visited.add(jobId);
    recursionStack.add(jobId);

    const job = ir.jobs.find(j => j.id === jobId);
    if (job?.needs) {
      for (const neighbor of job.needs) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
    }

    recursionStack.delete(jobId);
    return false;
  }

  for (const job of ir.jobs) {
    if (!visited.has(job.id)) {
      if (hasCycle(job.id)) {
        errors.push({ path: "jobs.dependencies", message: "Circular dependency detected in job needs graph." });
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}


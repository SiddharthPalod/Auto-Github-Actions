import type { CompilerPass, CompilerContext } from "./types.js";
import type { WorkflowIR } from "@auto-gha/workflow-ir";

export const productionHardeningPass: CompilerPass = {
  name: "production-hardening",
  description: "Enforces job timeouts, minimal permissions, and concurrency cancellation.",

  transform(ir: WorkflowIR, context: CompilerContext): WorkflowIR {
    if (context.options?.enableHardening === false) {
      return ir;
    }

    const defaultTimeout = context.options?.defaultTimeoutMinutes ?? 15;

    const updatedJobs = ir.jobs.map(job => ({
      ...job,
      timeoutMinutes: job.timeoutMinutes ?? defaultTimeout
    }));

    const concurrency = context.options?.enableConcurrency !== false
      ? {
          group: "${{ github.workflow }}-${{ github.ref }}",
          cancelInProgress: true
        }
      : ir.concurrency;

    return {
      ...ir,
      permissions: ir.permissions ?? {
        contents: "read"
      },
      concurrency,
      jobs: updatedJobs
    };
  }
};


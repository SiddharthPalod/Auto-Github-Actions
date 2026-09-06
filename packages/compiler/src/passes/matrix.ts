import type { CompilerPass, CompilerContext } from "./types.js";
import type { WorkflowIR } from "@auto-gha/workflow-ir";

export const matrixTestingPass: CompilerPass = {
  name: "matrix-testing",
  description: "Injects multi-version matrix testing strategies for configured runtimes.",

  transform(ir: WorkflowIR, context: CompilerContext): WorkflowIR {
    const matrixConfig = context.options?.matrixVersions;
    if (!matrixConfig) return ir;

    const updatedJobs = ir.jobs.map(job => {
      // 1. Node.js Matrix
      if (job.id === "test-node" && matrixConfig.node && matrixConfig.node.length > 1) {
        return {
          ...job,
          strategy: {
            matrix: { "node-version": matrixConfig.node }
          },
          steps: job.steps.map(step => {
            if (step.kind === "uses" && step.uses.startsWith("actions/setup-node")) {
              return {
                ...step,
                with: {
                  ...step.with,
                  "node-version": "${{ matrix.node-version }}"
                }
              };
            }
            return step;
          })
        };
      }

      // 2. Python Matrix
      if (job.id === "test-python" && matrixConfig.python && matrixConfig.python.length > 1) {
        return {
          ...job,
          strategy: {
            matrix: { "python-version": matrixConfig.python }
          },
          steps: job.steps.map(step => {
            if (step.kind === "uses" && step.uses.startsWith("actions/setup-python")) {
              return {
                ...step,
                with: {
                  ...step.with,
                  "python-version": "${{ matrix.python-version }}"
                }
              };
            }
            return step;
          })
        };
      }

      return job;
    });

    return {
      ...ir,
      jobs: updatedJobs
    };
  }
};


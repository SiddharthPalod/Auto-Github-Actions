import type {
  PlannedAction,
  WorkflowPlan
} from "@auto-gha/planner";

import {
  resolverRegistry
} from "./registry.js";

import type {
  ResolutionResult
} from "./types.js";


export function resolveAction(
  action: PlannedAction
): ResolutionResult {
  const resolver =
    resolverRegistry[action.type];

  if (!resolver) {
    return {
      action,

      resolved: [],

      warnings: [
        `No resolver registered for action type "${action.type}".`
      ]
    };
  }

  try {
    const resolved =
      resolver(action);

    return {
      action,

      resolved,

      warnings: []
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return {
      action,

      resolved: [],

      warnings: [
        `Failed to resolve "${action.id}": ${message}`
      ]
    };
  }
}

export type ResolvedWorkflowPlan = {
  results: ResolutionResult[];

  primitives: import("./types.js").ResolvedPrimitive[];

  warnings: string[];
};

export function resolvePlan(
  plan: WorkflowPlan
): ResolvedWorkflowPlan {
  const results =
    plan.actions.map(resolveAction);

  const primitives =
    results.flatMap(
      result => result.resolved
    );

  const warnings =
    results.flatMap(
      result => result.warnings
    );

  return {
    results,
    primitives,
    warnings
  };
}

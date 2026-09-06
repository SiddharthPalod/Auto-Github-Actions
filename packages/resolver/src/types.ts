import type {
  PlannedAction
} from "@auto-gha/planner";

export type ResolvedPrimitive =
  | ResolvedUsesPrimitive
  | ResolvedRunPrimitive;

export type ResolvedUsesPrimitive = {
  kind: "uses";

  uses: string;

  with?: Record<
    string,
    string | number | boolean
  >;

  reason: string;

  source: string;

  actionId: string;
};

export type ResolvedRunPrimitive = {
  kind: "run";

  run: string;

  reason: string;

  source: string;

  actionId: string;
};

export type ResolutionResult = {
  action: PlannedAction;

  resolved: ResolvedPrimitive[];

  warnings: string[];
};

export type ResolverContext = {
  projectRoot?: string;
};

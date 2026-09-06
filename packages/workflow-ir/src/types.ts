export type WorkflowTrigger =
  | { event: "push"; branches?: string[]; paths?: string[] }
  | { event: "pull_request"; branches?: string[]; paths?: string[] }
  | { event: "workflow_dispatch" };

export type WorkflowStep =
  | {
      id?: string;
      name?: string;
      if?: string;
      continueOnError?: boolean;
      kind: "uses";
      uses: string;
      with?: Record<string, string | number | boolean>;
      env?: Record<string, string>;
      source?: string;
    }
  | {
      id?: string;
      name?: string;
      if?: string;
      continueOnError?: boolean;
      kind: "run";
      run: string;
      env?: Record<string, string>;
      workingDirectory?: string;
      source?: string;
    };

export type WorkflowStrategy = {
  matrix?: Record<string, (string | number)[]>;
  failFast?: boolean;
  maxParallel?: number;
};

export type WorkflowJob = {
  id: string;
  name?: string;
  runsOn: string;
  if?: string;
  environment?: string;
  timeoutMinutes?: number;
  needs?: string[];
  strategy?: WorkflowStrategy;
  permissions?: Record<string, "read" | "write" | "none">;
  steps: WorkflowStep[];
};

export type WorkflowIR = {
  name: string;
  triggers: WorkflowTrigger[];
  permissions?: Record<string, "read" | "write" | "none">;
  concurrency?: {
    group: string;
    cancelInProgress?: boolean;
  };
  jobs: WorkflowJob[];
};

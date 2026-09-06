import type { ProjectState } from "@auto-gha/state";
import type { WorkflowIR } from "@auto-gha/workflow-ir";
import type { GeneratedSecurityArtifacts } from "@auto-gha/security";

export type GitHubAuthStatus = {
  isAuthenticated: boolean;
  username?: string;
  authMethod?: "gh-cli" | "token" | "none";
  error?: string;
};

export type CreatePullRequestOptions = {
  repoPath: string;
  remoteUrl: string;
  baseBranch?: string;
  prBranch?: string;
  state: ProjectState;
  ir: WorkflowIR;
  security: GeneratedSecurityArtifacts;
  files: Array<{ relativePath: string; content: string }>;
};

export type PullRequestResult = {
  success: boolean;
  prUrl?: string;
  branchName?: string;
  error?: string;
};


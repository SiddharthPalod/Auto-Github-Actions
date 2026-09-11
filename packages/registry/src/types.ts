import type { ProjectState } from "@auto-gha/state";
import type { WorkflowStep } from "@auto-gha/workflow-ir";

export type StepIR = WorkflowStep;

export interface FileSystemContext {
  readonly root: string;
  readonly files: ReadonlySet<string>;
  hasFile(relativePath: string): boolean;
  findFiles(predicate: (file: string) => boolean): string[];
  readFile(relativePath: string): Promise<string | null>;
  readJson<T = unknown>(relativePath: string): Promise<T | null>;
}

export interface ResolverContext {
  state: ProjectState;
  subprojectPath?: string;
  actionId?: string;
  source?: string;
}

export interface DetectionSpec {
  manifests?: string[];
  extensions?: string[];
  predicate?: (context: FileSystemContext, state: ProjectState) => Promise<boolean | void>;
}

export interface PluginResolvers {
  setup?: (ctx: ResolverContext) => StepIR[];
  test?: (ctx: ResolverContext) => StepIR[];
  build?: (ctx: ResolverContext) => StepIR[];
  deploy?: (ctx: ResolverContext) => StepIR[];
  [customAction: string]: ((ctx: ResolverContext) => StepIR[]) | undefined;
}

export interface AutoGhaPlugin {
  id: string;
  name: string;
  type: "language" | "tool" | "deployment" | "testing" | "infrastructure" | "framework";
  detection: DetectionSpec;
  provides: string[];
  resolvers: PluginResolvers;
  jobMeta?: {
    id: string;
    name: string;
    category?: "test" | "build" | "deploy";
  };
}

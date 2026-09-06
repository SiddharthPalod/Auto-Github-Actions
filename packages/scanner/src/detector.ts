import type { ProjectState } from "@auto-gha/state";

export type RepositoryContext = {
  readonly root: string;
  readonly files: ReadonlySet<string>;
  hasFile(relativePath: string): boolean;
  findFiles(predicate: (file: string) => boolean): string[];
  readFile(relativePath: string): Promise<string | null>;
  readJson<T = unknown>(relativePath: string): Promise<T | null>;
};

export interface Detector {
  readonly name: string;
  detect(context: RepositoryContext, state: ProjectState): Promise<void>;
}
import type { ProjectState } from "@auto-gha/state";
import type { CodeScanningScanner, CodeScanningTargetConfig } from "../types.js";

export interface ScannerPlugin {
  id: CodeScanningScanner;
  name: string;
  jobKey: string;
  jobName: string;
  timeoutMinutes: number;
  description?: string;
  icon?: string;
  category?: "sast" | "sca" | "iac" | "dast" | "container" | "supply-chain" | "linter";
  isApplicable?(state: ProjectState): boolean;
  buildSteps(scanner: CodeScanningTargetConfig): Array<Record<string, unknown>>;
}

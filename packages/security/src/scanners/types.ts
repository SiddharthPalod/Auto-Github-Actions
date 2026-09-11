import type { CodeScanningScanner, CodeScanningTargetConfig } from "../types.js";

export interface ScannerPlugin {
  id: CodeScanningScanner;
  name: string;
  jobKey: string;
  jobName: string;
  timeoutMinutes: number;
  buildSteps(scanner: CodeScanningTargetConfig): Array<Record<string, unknown>>;
}

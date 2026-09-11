import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const stackhawkScanner: ScannerPlugin = {
  id: "stackhawk",
  name: "StackHawk DAST",
  icon: "🦅",
  description: "Dynamic Application Security Testing (DAST) for web apps and APIs",
  jobKey: "stackhawk",
  jobName: "Dynamic API Security Testing (StackHawk)",
  timeoutMinutes: 30,
  isApplicable(state: ProjectState) {
    return state.tooling.some(t => t.name === "stackhawk" || t.evidence.some(e => e.source.includes("stackhawk"))) || state.infrastructure.some(i => i.evidence.some(e => e.source.includes("stackhawk"))) || state.runtime.length > 0;
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run StackHawk HawkScan",
        uses: "stackhawk/hawkscan-action@v2",
        with: {
          apiKey: "${{ secrets.HAWK_API_KEY }}",
          configurationFiles: "stackhawk.yml"
        }
      }
    ];
  }
};

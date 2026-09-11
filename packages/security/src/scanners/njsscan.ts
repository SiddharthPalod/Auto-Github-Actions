import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const njsscanScanner: ScannerPlugin = {
  id: "njsscan",
  name: "njsscan Node.js SAST",
  icon: "🟨",
  description: "Static application security testing for Node.js / JavaScript",
  jobKey: "njsscan",
  jobName: "Node.js Static Analysis (njsscan)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "node");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run njsscan",
        uses: "ajinabraham/njsscan-action@master",
        with: {
          args: ". --sarif --output njsscan.sarif"
        }
      },
      {
        name: "Upload njsscan scan results",
        if: "always() && hashFiles('njsscan.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "njsscan.sarif"
        }
      }
    ];
  }
};

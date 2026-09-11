import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const flawfinderScanner: ScannerPlugin = {
  id: "flawfinder",
  name: "Flawfinder C/C++ SAST",
  icon: "🛡️",
  description: "C/C++ source code vulnerability scanning (CWE detection)",
  jobKey: "flawfinder",
  jobName: "C/C++ Security (Flawfinder)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "cpp");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Flawfinder",
        uses: "david-a-wheeler/flawfinder@2.0.19",
        with: {
          arguments: "--sarif .",
          output: "flawfinder.sarif"
        }
      },
      {
        name: "Upload Flawfinder scan results",
        if: "always() && hashFiles('flawfinder.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "flawfinder.sarif"
        }
      }
    ];
  }
};

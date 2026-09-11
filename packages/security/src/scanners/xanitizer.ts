import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const xanitizerScanner: ScannerPlugin = {
  id: "xanitizer",
  name: "Xanitizer Java/Kotlin SAST",
  icon: "☕",
  description: "Java/Kotlin SAST taint analysis and vulnerability scanner",
  jobKey: "xanitizer",
  jobName: "Java/Kotlin SAST (Xanitizer)",
  timeoutMinutes: 15,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "java" || r.name === "scala");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Xanitizer Security Analysis",
        uses: "RIGS-IT/xanitizer-action@v2",
        with: {
          output: "xanitizer.sarif"
        }
      },
      {
        name: "Upload Xanitizer scan results",
        if: "always() && hashFiles('xanitizer.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "xanitizer.sarif"
        }
      }
    ];
  }
};

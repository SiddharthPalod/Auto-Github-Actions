import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const semgrepScanner: ScannerPlugin = {
  id: "semgrep",
  name: "Semgrep SAST",
  icon: "🧠",
  description: "Universal multi-language static application security testing",
  jobKey: "semgrep",
  jobName: "Semgrep SAST Analysis",
  timeoutMinutes: 15,
  isApplicable(_state: ProjectState) {
    return true;
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Semgrep SAST",
        uses: "semgrep/semgrep-action@v1",
        with: {
          config: "auto",
          generateSarif: "1"
        },
        "continue-on-error": true
      },
      {
        name: "Upload Semgrep scan results",
        if: "always() && hashFiles('semgrep.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "semgrep.sarif"
        }
      }
    ];
  }
};

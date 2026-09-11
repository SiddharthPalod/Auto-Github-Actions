import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const osvScanner: ScannerPlugin = {
  id: "osv-scanner",
  name: "Google OSV-Scanner",
  icon: "🔍",
  description: "Open-source CVE vulnerability scan across repository lockfiles",
  jobKey: "osv-scanner",
  jobName: "Open Source Vulnerability Scan (Google OSV)",
  timeoutMinutes: 10,
  isApplicable(_state: ProjectState) {
    return true;
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Google OSV-Scanner",
        uses: "google/osv-scanner-action/osv-scanner-action@v1.9.0",
        with: {
          "scan-args": "--call-analysis=false --format=sarif --output=osv-results.sarif ."
        },
        "continue-on-error": true
      },
      {
        name: "Upload OSV-Scanner results",
        if: "always() && hashFiles('osv-results.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "osv-results.sarif"
        }
      }
    ];
  }
};

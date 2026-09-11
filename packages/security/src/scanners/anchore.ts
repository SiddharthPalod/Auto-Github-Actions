import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const anchoreScanner: ScannerPlugin = {
  id: "anchore",
  name: "Anchore Grype",
  jobKey: "anchore",
  jobName: "Vulnerability Scan (Anchore Grype)",
  timeoutMinutes: 15,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Anchore Grype Vulnerability Scanner",
        uses: "anchore/scan-action@v4",
        with: {
          path: ".",
          "fail-build": false,
          "output-format": "sarif",
          severity: "high"
        }
      },
      {
        name: "Upload Anchore scan results",
        if: "always() && hashFiles('results.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "results.sarif"
        }
      }
    ];
  }
};

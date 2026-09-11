import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const scorecardScanner: ScannerPlugin = {
  id: "scorecard",
  name: "OpenSSF Scorecard",
  jobKey: "scorecard",
  jobName: "Supply Chain Security (OpenSSF Scorecard)",
  timeoutMinutes: 15,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run OpenSSF Scorecard",
        uses: "ossf/scorecard-action@v2.4.0",
        with: {
          results_file: "scorecard-results.sarif",
          results_format: "sarif",
          publish_results: false
        }
      },
      {
        name: "Upload Scorecard scan results",
        if: "always() && hashFiles('scorecard-results.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "scorecard-results.sarif"
        }
      }
    ];
  }
};

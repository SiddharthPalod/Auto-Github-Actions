import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const flawfinderScanner: ScannerPlugin = {
  id: "flawfinder",
  name: "Flawfinder",
  jobKey: "flawfinder",
  jobName: "C/C++ Security (Flawfinder)",
  timeoutMinutes: 10,
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

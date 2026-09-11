import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const xanitizerScanner: ScannerPlugin = {
  id: "xanitizer",
  name: "Xanitizer SAST",
  jobKey: "xanitizer",
  jobName: "Java/Kotlin SAST (Xanitizer)",
  timeoutMinutes: 15,
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

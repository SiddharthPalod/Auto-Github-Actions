import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const stackhawkScanner: ScannerPlugin = {
  id: "stackhawk",
  name: "StackHawk DAST",
  jobKey: "stackhawk",
  jobName: "Dynamic API Security Testing (StackHawk)",
  timeoutMinutes: 30,
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

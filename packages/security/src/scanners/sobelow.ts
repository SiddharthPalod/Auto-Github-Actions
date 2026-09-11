import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const sobelowScanner: ScannerPlugin = {
  id: "sobelow",
  name: "Sobelow",
  jobKey: "sobelow",
  jobName: "Elixir / Phoenix Security (Sobelow)",
  timeoutMinutes: 10,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Sobelow",
        uses: "sobelow/action@v1"
      }
    ];
  }
};

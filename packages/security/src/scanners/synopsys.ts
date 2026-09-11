import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const synopsysScanner: ScannerPlugin = {
  id: "synopsys",
  name: "Synopsys Black Duck",
  jobKey: "synopsys",
  jobName: "Software Composition Analysis (Black Duck)",
  timeoutMinutes: 20,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Synopsys Action",
        uses: "synopsys-sig/synopsys-action@v1.9.0",
        with: {
          blackduck_url: "${{ secrets.BLACKDUCK_URL }}",
          blackduck_api_token: "${{ secrets.BLACKDUCK_API_TOKEN }}"
        }
      }
    ];
  }
};

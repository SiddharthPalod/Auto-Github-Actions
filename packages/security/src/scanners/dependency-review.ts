import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const dependencyReviewScanner: ScannerPlugin = {
  id: "dependency-review",
  name: "Dependency Review",
  jobKey: "dependency-review",
  jobName: "Dependency Review (PR)",
  timeoutMinutes: 10,
  buildSteps(scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Dependency Review",
        if: "github.event_name == 'pull_request'",
        uses: "actions/dependency-review-action@v4",
        with: {
          "fail-on-severity": scanner.failOnError ? "high" : "critical"
        },
        "continue-on-error": true
      }
    ];
  }
};

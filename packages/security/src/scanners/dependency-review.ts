import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const dependencyReviewScanner: ScannerPlugin = {
  id: "dependency-review",
  name: "GitHub Dependency Review",
  icon: "🔍",
  description: "Prevents vulnerable dependencies from being introduced in PRs",
  jobKey: "dependency-review",
  jobName: "Dependency Review (PR)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.packageManager.length > 0 || state.runtime.length > 0;
  },
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

import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const banditScanner: ScannerPlugin = {
  id: "bandit",
  name: "Bandit Python SAST",
  icon: "🐍",
  description: "Security linter designed to find common security issues in Python code",
  jobKey: "bandit",
  jobName: "Python Security Scan (Bandit)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "python");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Set up Python",
        uses: "actions/setup-python@v5",
        with: { "python-version": "3.x" }
      },
      {
        name: "Run Bandit Security Linter",
        run: "pip install bandit && bandit -r . -f custom --msg-template '{abspath}:{line}: [{test_id}] {msg}' || true"
      }
    ];
  }
};

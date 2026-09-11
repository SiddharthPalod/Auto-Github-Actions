import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const hadolintScanner: ScannerPlugin = {
  id: "hadolint",
  name: "Hadolint",
  jobKey: "hadolint",
  jobName: "Dockerfile Lint (Hadolint)",
  timeoutMinutes: 10,
  buildSteps(scanner: CodeScanningTargetConfig) {
    const target = scanner.targetPath ?? "Dockerfile";
    return [
      {
        name: "Lint Dockerfile with Hadolint",
        uses: "hadolint/hadolint-action@v3.1.0",
        with: {
          dockerfile: target,
          format: "sarif",
          "output-file": "hadolint.sarif",
          "no-fail": !scanner.failOnError
        }
      },
      {
        name: "Upload Hadolint scan results",
        if: "always() && hashFiles('hadolint.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "hadolint.sarif"
        }
      }
    ];
  }
};

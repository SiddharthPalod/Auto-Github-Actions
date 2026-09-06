import { stringify } from "yaml";
import type { SecurityPolicyIR, CodeScanningTargetConfig } from "../types.js";

export function compileCodeScanningWorkflowYAML(policy: SecurityPolicyIR): string {
  if (!policy.codeScanning.enabled || policy.codeScanning.scanners.length === 0) {
    return "";
  }

  const jobs: Record<string, unknown> = {};

  for (const scanner of policy.codeScanning.scanners) {
    const jobKey = `scan-${scanner.tool}`;
    const steps: Array<Record<string, unknown>> = [
      {
        name: "Checkout repository",
        uses: "actions/checkout@v4"
      }
    ];

    if (policy.secretScanning.enabled) {
      steps.unshift({
        name: "Harden GitHub Actions Runner",
        uses: "step-security/harden-runner@v2",
        with: {
          "egress-policy": "audit"
        }
      });
    }

    switch (scanner.tool) {
      case "semgrep": {
        steps.push(
          {
            name: "Run Semgrep SAST",
            uses: "returntocorp/semgrep-action@v1",
            with: {
              config: "p/default",
              generateSarif: "1"
            }
          },
          {
            name: "Upload Semgrep scan results",
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "semgrep.sarif"
            }
          }
        );
        jobs["semgrep"] = {
          name: "Semgrep SAST Analysis",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 15,
          steps
        };
        break;
      }

      case "hadolint": {
        const target = scanner.targetPath ?? "Dockerfile";
        steps.push(
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
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "hadolint.sarif"
            }
          }
        );
        jobs["hadolint"] = {
          name: "Dockerfile Lint (Hadolint)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "tfsec": {
        steps.push(
          {
            name: "Scan Terraform IaC with tfsec",
            uses: "aquasecurity/tfsec-action@v1.0.3",
            with: {
              sarif_file: "tfsec.sarif",
              "soft-fail": !scanner.failOnError
            }
          },
          {
            name: "Upload tfsec scan results",
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "tfsec.sarif"
            }
          }
        );
        jobs["tfsec"] = {
          name: "Terraform IaC Security (tfsec)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "bandit": {
        steps.push(
          {
            name: "Set up Python",
            uses: "actions/setup-python@v5",
            with: { "python-version": "3.x" }
          },
          {
            name: "Run Bandit Security Linter",
            run: "pip install bandit && bandit -r . -f custom --msg-template '{abspath}:{line}: [{test_id}] {msg}' || true"
          }
        );
        jobs["bandit"] = {
          name: "Python Security Scan (Bandit)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "brakeman": {
        steps.push(
          {
            name: "Set up Ruby",
            uses: "ruby/setup-ruby@v1",
            with: { "ruby-version": "3.2" }
          },
          {
            name: "Run Brakeman",
            uses: "brakeman/brakeman-action@v1",
            with: {
              sarif_file: "brakeman.sarif"
            }
          },
          {
            name: "Upload Brakeman scan results",
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "brakeman.sarif"
            }
          }
        );
        jobs["brakeman"] = {
          name: "Ruby / Rails Security Scan (Brakeman)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "dependency-review": {
        steps.push({
          name: "Dependency Review",
          if: "github.event_name == 'pull_request'",
          uses: "actions/dependency-review-action@v4",
          with: {
            "fail-on-severity": scanner.failOnError ? "high" : "critical"
          },
          "continue-on-error": true
        });
        jobs["dependency-review"] = {
          name: "Dependency Review (PR)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "osv-scanner": {
        steps.push(
          {
            name: "Run Google OSV-Scanner",
            uses: "google/osv-scanner-action/osv-scanner-action@v1.9.0",
            with: {
              "scan-args": "--format=sarif --output=osv-results.sarif ."
            }
          },
          {
            name: "Upload OSV-Scanner results",
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "osv-results.sarif"
            }
          }
        );
        jobs["osv-scanner"] = {
          name: "Open Source Vulnerability Scan (Google OSV)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      case "scorecard": {
        steps.push(
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
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "scorecard-results.sarif"
            }
          }
        );
        jobs["scorecard"] = {
          name: "Supply Chain Security (OpenSSF Scorecard)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 15,
          steps
        };
        break;
      }

      case "njsscan": {
        steps.push(
          {
            name: "Run njsscan",
            uses: "ajinabraham/njsscan-action@master",
            with: {
              args: ". --sarif --output njsscan.sarif"
            }
          },
          {
            name: "Upload njsscan scan results",
            uses: "github/codeql-action/upload-sarif@v3",
            with: {
              sarif_file: "njsscan.sarif"
            }
          }
        );
        jobs["njsscan"] = {
          name: "Node.js Static Analysis (njsscan)",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 10,
          steps
        };
        break;
      }

      default:
        break;
    }
  }

  if (Object.keys(jobs).length === 0) {
    return "";
  }

  const doc = {
    name: "Code Scanning & Security Analyzers",
    on: {
      push: { branches: ["main"] },
      pull_request: { branches: ["main"] }
    },
    permissions: {
      contents: "read",
      "security-events": "write",
      "pull-requests": "write"
    },
    concurrency: {
      group: "${{ github.workflow }}-${{ github.ref }}",
      "cancel-in-progress": true
    },
    jobs
  };

  const yamlBody = stringify(doc, {
    indent: 2,
    lineWidth: 0,
    simpleKeys: true,
    aliasDuplicateObjects: false
  });

  return `# ==============================================================================
# Generated by Zero-Config CI/CD Engine
# Code Scanning & SAST Workflow (Level: ${policy.level})
# ==============================================================================

${yamlBody}`;
}

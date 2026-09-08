import { intro, outro, text, multiselect, select, confirm, spinner, note, isCancel, cancel } from "@clack/prompts";
import pc from "picocolors";
import { promises as fs } from "node:fs";
import path from "node:path";
import { scanRepository } from "@auto-gha/scanner";
import { planWorkflow } from "@auto-gha/planner";
import { resolvePlan } from "@auto-gha/resolver";
import { buildWorkflowIR, compileWorkflowYAML } from "@auto-gha/compiler";
import {
  compileSecurityPolicy,
  compileSecurityArtifacts,
  resolveSecurityPolicy,
  type SecurityLevel,
  type SecurityPolicyIR
} from "@auto-gha/security";
import { withRepository, isRemoteUrl } from "./git.js";

/**
 * Wizard v1: Minimalist, fast interactive flow with Security Policy support
 */
export async function runInteractiveWizard(initialTarget?: string): Promise<void> {
  intro(pc.bgCyan(pc.black(" Auto GitHub Actions (auto-gha) ")));

  let target = initialTarget ? initialTarget.trim() : "";
  if (!target) {
    const targetInput = await text({
      message: "Enter the repository path or GitHub URL to scan:",
      placeholder: "./",
      defaultValue: "./",
      validate: (value) => {
        if (!value || value.trim() === "") return "Please enter a valid path or URL.";
      }
    });

    if (isCancel(targetInput)) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    target = String(targetInput).trim();
  }
  const s = spinner();

  try {
    await withRepository(target, async (scanPath) => {
      s.start("Scanning repository and analyzing capabilities...");

      const state = await scanRepository(scanPath);
      const plan = planWorkflow(state);
      const resolvedPlan = resolvePlan(plan);
      const ir = buildWorkflowIR(plan, resolvedPlan);

      s.stop(pc.green("Repository analysis complete!"));

      const capLines = plan.capabilities.map(c => {
        const versionStr = c.version ? ` (${c.version})` : "";
        return `  ${pc.cyan("✓")} ${c.id}${versionStr}`;
      });

      note(
        capLines.length > 0
          ? capLines.join("\n")
          : pc.yellow("  No recognized runtimes or test frameworks found."),
        "Discovered Capabilities"
      );

      if (ir.jobs.length === 0) {
        outro(pc.yellow("No CI/CD actions could be planned for this repository."));
        return;
      }

      const jobOptions = ir.jobs.map(job => {
        const isDeploy = job.id.startsWith("deploy") || job.id.startsWith("publish");
        const icon = isDeploy ? "🚀" : "🧪";
        const category = isDeploy ? "CD Deployment" : "CI Pipeline";
        const needsTag = job.needs && job.needs.length > 0 ? ` (after: ${job.needs.join(", ")})` : "";
        return {
          value: job.id,
          label: `${icon} ${pc.bold(job.name ?? job.id)}`,
          hint: `${category} on ${job.runsOn}${needsTag}`
        };
      });

      const selectedJobIds = await multiselect({
        message: "Select CI/CD jobs to generate (Space to toggle, Enter to confirm):",
        options: jobOptions,
        initialValues: jobOptions.map(j => j.value),
        required: true,
        maxItems: 15
      });

      if (isCancel(selectedJobIds)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const activeJobIds = new Set(selectedJobIds as string[]);

      const enableCaching = await confirm({
        message: "⚡ Enable automatic dependency caching (npm/pnpm/yarn/pip/go/cargo)?",
        initialValue: true
      });

      if (isCancel(enableCaching)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const enableHardening = await confirm({
        message: "🛡️  Enable production hardening (15m job timeouts & cancel-in-progress concurrency)?",
        initialValue: true
      });

      if (isCancel(enableHardening)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const securityLevelInput = await select({
        message: "🔒 Select Security Policy Level:",
        options: [
          {
            value: "standard",
            label: `🛡️  Standard ${pc.green("(Recommended)")}`,
            hint: "CodeQL SAST + Trivy container scan + Dependabot + Lockfile audits"
          },
          {
            value: "strict",
            label: "🔒 Strict",
            hint: "Harden-Runner + Gitleaks + Semgrep + Daily Dependabot + Zero-tolerance gating"
          },
          {
            value: "minimal",
            label: "⚡ Minimal",
            hint: "Dependabot + Native lockfile audits only"
          },
          {
            value: "custom",
            label: "🛠️  Custom (Fine-Grained Adjustments)",
            hint: "Selectively toggle CodeQL, Google OSV, Dependabot, Trivy, Gitleaks, etc."
          },
          {
            value: "none",
            label: "🚫 None",
            hint: "Skip security configuration"
          }
        ],
        initialValue: "standard",
        maxItems: 10
      });

      if (isCancel(securityLevelInput)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      let securityArtifacts;

      if (securityLevelInput === "custom") {
        const basePolicy = resolveSecurityPolicy(state, "standard");
        const scannerOptions: Array<{ value: string; label: string; hint?: string }> = [];

        if (basePolicy.codeql.enabled && basePolicy.codeql.languages.length > 0) {
          scannerOptions.push({
            value: "codeql",
            label: "🛡️  GitHub CodeQL SAST",
            hint: `Deep multi-language code analysis for ${basePolicy.codeql.languages.join(", ")}`
          });
        }

        if (basePolicy.dependabot.enabled && basePolicy.dependabot.ecosystems.length > 0) {
          const ecosystems = basePolicy.dependabot.ecosystems.map(e => e.packageEcosystem).join(", ");
          scannerOptions.push({
            value: "dependabot",
            label: "🤖 Dependabot",
            hint: `Automated version & security PRs for ${ecosystems} (with PR grouping)`
          });
        }

        scannerOptions.push({
          value: "osv-scanner",
          label: "🔍 Google OSV-Scanner",
          hint: "Open-source CVE vulnerability scan across repository lockfiles"
        });

        if (basePolicy.containerScanning.dockerfiles.length > 0) {
          scannerOptions.push({
            value: "container-trivy",
            label: "📦 Trivy Container & IaC Scan",
            hint: "Vulnerability analysis for Dockerfiles & manifests"
          });
          scannerOptions.push({
            value: "hadolint",
            label: "🐳 Hadolint Dockerfile Linter",
            hint: "Lints Dockerfile best practices & security rules"
          });
        }

        if (basePolicy.nativeAudits.length > 0) {
          const auditTools = basePolicy.nativeAudits.map(a => a.tool).join(", ");
          scannerOptions.push({
            value: "native-audits",
            label: "⚡ Native Lockfile Audits",
            hint: `Runs native audits (${auditTools})`
          });
        }

        scannerOptions.push({
          value: "gitleaks",
          label: "🔑 Gitleaks (Secret Scanning)",
          hint: "Detects hardcoded secrets & credentials in git history"
        });

        scannerOptions.push({
          value: "semgrep",
          label: "🧠 Semgrep SAST",
          hint: "Universal static application security testing"
        });

        scannerOptions.push({
          value: "scorecard",
          label: "📊 OpenSSF Scorecard",
          hint: "Supply chain security posture & repository health"
        });

        const selectedCustom = await multiselect({
          message: "Toggle Security Modules (Space to toggle, Enter to confirm):",
          options: scannerOptions,
          initialValues: scannerOptions.slice(0, 5).map(o => o.value),
          required: false,
          maxItems: 15
        });

        if (isCancel(selectedCustom)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        const selectedSet = new Set(selectedCustom as string[]);

        const customPolicy: SecurityPolicyIR = {
          level: "standard",
          dependabot: {
            enabled: selectedSet.has("dependabot") && basePolicy.dependabot.ecosystems.length > 0,
            ecosystems: basePolicy.dependabot.ecosystems
          },
          nativeAudits: selectedSet.has("native-audits") ? basePolicy.nativeAudits : [],
          codeql: {
            enabled: selectedSet.has("codeql") && basePolicy.codeql.languages.length > 0,
            languages: basePolicy.codeql.languages,
            scheduleCron: basePolicy.codeql.scheduleCron
          },
          codeScanning: {
            enabled: selectedSet.has("osv-scanner") || selectedSet.has("hadolint") || selectedSet.has("semgrep") || selectedSet.has("scorecard"),
            scanners: [
              ...(selectedSet.has("osv-scanner") ? [{ tool: "osv-scanner" as const, failOnError: false, uploadSarif: true }] : []),
              ...(selectedSet.has("hadolint") && basePolicy.containerScanning.dockerfiles.length > 0 ? [{ tool: "hadolint" as const, targetPath: basePolicy.containerScanning.dockerfiles[0], failOnError: false, uploadSarif: true }] : []),
              ...(selectedSet.has("semgrep") ? [{ tool: "semgrep" as const, failOnError: false, uploadSarif: true }] : []),
              ...(selectedSet.has("scorecard") ? [{ tool: "scorecard" as const, failOnError: false, uploadSarif: true }] : [])
            ]
          },
          containerScanning: {
            enabled: selectedSet.has("container-trivy") && basePolicy.containerScanning.dockerfiles.length > 0,
            dockerfiles: basePolicy.containerScanning.dockerfiles,
            severityThreshold: "HIGH,CRITICAL",
            uploadSarif: false
          },
          secretScanning: {
            enabled: selectedSet.has("gitleaks"),
            tool: "gitleaks"
          },
          enforcement: {
            blockOnVulnerabilities: false
          }
        };

        securityArtifacts = compileSecurityArtifacts(customPolicy);
      } else {
        const securityLevel = securityLevelInput as SecurityLevel;
        securityArtifacts = compileSecurityPolicy(state, securityLevel);
      }

      const filteredJobs = ir.jobs
        .filter(j => activeJobIds.has(j.id))
        .map(j => ({
          ...j,
          needs: j.needs ? j.needs.filter(need => activeJobIds.has(need)) : undefined
        }));

      const filteredIR = {
        ...ir,
        jobs: filteredJobs
      };

      const compiledCiYaml = compileWorkflowYAML(filteredIR, {
        state,
        plan,
        resolved: resolvedPlan,
        options: {
          enableCaching: Boolean(enableCaching),
          enableHardening: Boolean(enableHardening)
        }
      });

      note(compiledCiYaml, "Generated Workflow Preview (.github/workflows/ci.yml)");

      if (securityArtifacts.dependabotYaml) {
        note(securityArtifacts.dependabotYaml, "Generated Dependabot (.github/dependabot.yml)");
      }

      if (isRemoteUrl(target)) {
        const repoName = target.split("/").pop()?.replace(/\.git$/, "") || "repo";
        const defaultSaveDir = `./${repoName}-ci`;

        const shouldSave = await confirm({
          message: "Would you like to save all generated workflow & security files locally?",
          initialValue: true
        });

        if (isCancel(shouldSave) || !shouldSave) {
          outro(pc.green(`✨ Workflow preview complete for remote repo ${target}!`));
          return;
        }

        const saveDirInput = await text({
          message: "Enter directory to save configuration files:",
          placeholder: defaultSaveDir,
          defaultValue: defaultSaveDir,
          validate: (val) => {
            if (!val || val.trim() === "") return "Please enter a valid directory path.";
          }
        });

        if (isCancel(saveDirInput)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        const baseDir = path.resolve(process.cwd(), String(saveDirInput).trim());
        const workflowsDir = path.join(baseDir, ".github", "workflows");
        const githubDir = path.join(baseDir, ".github");

        await fs.mkdir(workflowsDir, { recursive: true });
        await fs.writeFile(path.join(workflowsDir, "ci.yml"), compiledCiYaml, "utf8");

        if (securityArtifacts.dependabotYaml) {
          await fs.writeFile(path.join(githubDir, "dependabot.yml"), securityArtifacts.dependabotYaml, "utf8");
        }
        if (securityArtifacts.codeqlYaml) {
          await fs.writeFile(path.join(workflowsDir, "codeql.yml"), securityArtifacts.codeqlYaml, "utf8");
        }
        if (securityArtifacts.securityWorkflowYaml) {
          await fs.writeFile(path.join(workflowsDir, "security.yml"), securityArtifacts.securityWorkflowYaml, "utf8");
        }

        outro(pc.green(`✨ Successfully saved configurations to ${pc.bold(baseDir)}`));
        return;
      }

      const shouldWrite = await confirm({
        message: `Write configuration files to ${pc.cyan(target)}?`,
        initialValue: true
      });

      if (isCancel(shouldWrite) || !shouldWrite) {
        outro(pc.yellow("Workflow generation skipped (not written to disk)."));
        return;
      }

      const targetWorkflowsDir = path.resolve(target, ".github", "workflows");
      const targetGithubDir = path.resolve(target, ".github");

      await fs.mkdir(targetWorkflowsDir, { recursive: true });
      await fs.writeFile(path.join(targetWorkflowsDir, "ci.yml"), compiledCiYaml, "utf8");

      if (securityArtifacts.dependabotYaml) {
        await fs.writeFile(path.join(targetGithubDir, "dependabot.yml"), securityArtifacts.dependabotYaml, "utf8");
      }
      if (securityArtifacts.codeqlYaml) {
        await fs.writeFile(path.join(targetWorkflowsDir, "codeql.yml"), securityArtifacts.codeqlYaml, "utf8");
      }
      if (securityArtifacts.securityWorkflowYaml) {
        await fs.writeFile(path.join(targetWorkflowsDir, "security.yml"), securityArtifacts.securityWorkflowYaml, "utf8");
      }

      outro(
        pc.green(
          `✨ Successfully wrote configurations to ${pc.bold(target)}\n\n` +
          `   Next steps:\n` +
          `   1. git add .github/\n` +
          `   2. git commit -m "ci: add zero-config CI/CD and security automation"\n` +
          `   3. git push origin main`
        )
      );
    });
  } catch (error) {
    s.stop(pc.red("Error occurred"));
    console.error(pc.red(`\n[Error] ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

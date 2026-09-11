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
  ALL_SCANNERS,
  type SecurityLevel,
  type SecurityPolicyIR,
  type CodeScanningTargetConfig
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

      // Rich Discovered Architecture & Capabilities Summary Box
      const summaryItems: string[] = [];

      if (state.runtime.length > 0) {
        const runtimes = state.runtime.map(r => pc.bold(pc.green(r.name))).join(", ");
        summaryItems.push(`  ${pc.bold("Runtimes:")}      ${runtimes}`);
      }

      if (state.packageManager.length > 0) {
        const pms = state.packageManager.map(p => pc.bold(pc.magenta(p.name))).join(", ");
        summaryItems.push(`  ${pc.bold("Package Mgrs:")}  ${pms}`);
      }

      if (state.frameworks.length > 0) {
        const frameworks = state.frameworks.map(f => pc.cyan(f.name)).join(", ");
        summaryItems.push(`  ${pc.bold("Frameworks:")}   ${frameworks}`);
      }

      if (state.tooling && state.tooling.length > 0) {
        const tools = state.tooling.map(t => pc.blue(t.name)).join(", ");
        summaryItems.push(`  ${pc.bold("Tooling:")}       ${tools}`);
      }

      if (state.infrastructure.length > 0) {
        const infra = state.infrastructure.map(i => pc.yellow(i.name)).join(", ");
        summaryItems.push(`  ${pc.bold("Infrastructure:")} ${infra}`);
      }

      if (plan.actions.length > 0) {
        summaryItems.push("");
        summaryItems.push(pc.bold("  Planned Policy Actions:"));
        for (const action of plan.actions) {
          summaryItems.push(`    → ${pc.cyan(action.id)}: ${action.reason}`);
        }
      }

      note(
        summaryItems.length > 0
          ? summaryItems.join("\n")
          : pc.yellow("  No recognized runtimes or test frameworks found."),
        "Analyzed Architecture & Discovered Capabilities"
      );

      if (ir.jobs.length === 0) {
        outro(pc.yellow("No CI/CD actions could be planned for this repository."));
        return;
      }

      const jobOptions = ir.jobs.map(job => {
        const isDeploy = job.id.startsWith("deploy") || job.id.startsWith("publish") || job.id.includes("cloud") || job.id.includes("iks") || job.id.includes("tke") || job.id.includes("octopus");
        const isLint = job.id.includes("lint") || job.id.includes("clippy") || job.id.includes("format");
        const isBuild = job.id.includes("build") || job.id.includes("compile") || job.id.includes("webpack");
        const isTest = job.id.includes("test") || job.id.includes("ci");

        let icon = "🧪";
        let category = "CI Pipeline";
        if (isDeploy) {
          icon = "🚀";
          category = "CD Deployment";
        } else if (isLint) {
          icon = "🧹";
          category = "Code Quality & Linting";
        } else if (isBuild) {
          icon = "📦";
          category = "Build Pipeline";
        } else if (isTest) {
          icon = "🧪";
          category = "Test Suite";
        }

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
        maxItems: 20
      });

      if (isCancel(selectedJobIds)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const activeJobIds = new Set(selectedJobIds as string[]);

      const enableCaching = await confirm({
        message: "⚡ Enable automatic dependency caching (npm/pnpm/yarn/pip/go/cargo/maven/gradle/composer/sbt/renv)?",
        initialValue: true
      });

      if (isCancel(enableCaching)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const enableHardening = await confirm({
        message: "🛡️  Enable production hardening (15m job timeouts, concurrency cancellation & least-privilege permissions)?",
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
            hint: "CodeQL SAST + Trivy container scan + Dependabot + Lockfile audits (npm/cargo/pip/govulncheck)"
          },
          {
            value: "strict",
            label: "🔒 Strict",
            hint: "Harden-Runner + Gitleaks + Semgrep + Anchore Grype + Daily Dependabot + Zero-tolerance gating"
          },
          {
            value: "minimal",
            label: "⚡ Minimal",
            hint: "Dependabot + Native lockfile audits only"
          },
          {
            value: "custom",
            label: "🛠️  Custom (Fine-Grained Adjustments)",
            hint: "Selectively toggle from 22+ security modules (CodeQL, OSV, Semgrep, Trivy, Gitleaks, Anchore, StackHawk, etc.)"
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
        const recommendedSet = new Set<string>();
        const scannerOptions: Array<{ value: string; label: string; hint?: string }> = [];

        // 1. Core Ecosystem Security
        if (basePolicy.codeql.enabled && basePolicy.codeql.languages.length > 0) {
          scannerOptions.push({
            value: "codeql",
            label: "🛡️  GitHub CodeQL SAST",
            hint: `Deep multi-language code analysis for ${basePolicy.codeql.languages.join(", ")}`
          });
          recommendedSet.add("codeql");
        }

        if (basePolicy.dependabot.enabled && basePolicy.dependabot.ecosystems.length > 0) {
          const ecosystems = basePolicy.dependabot.ecosystems.map(e => e.packageEcosystem).join(", ");
          scannerOptions.push({
            value: "dependabot",
            label: "🤖 Dependabot",
            hint: `Automated version & security PRs for ${ecosystems} (with PR grouping)`
          });
          recommendedSet.add("dependabot");
        }

        if (basePolicy.nativeAudits.length > 0) {
          const auditTools = basePolicy.nativeAudits.map(a => a.tool).join(", ");
          scannerOptions.push({
            value: "native-audits",
            label: "⚡ Native Lockfile Audits",
            hint: `Runs native audits (${auditTools})`
          });
          recommendedSet.add("native-audits");
        }

        if (basePolicy.containerScanning.dockerfiles.length > 0) {
          scannerOptions.push({
            value: "container-trivy",
            label: "📦 Trivy Container & IaC Scan",
            hint: "Vulnerability analysis for Dockerfiles & manifests"
          });
          recommendedSet.add("container-trivy");
        }

        scannerOptions.push({
          value: "gitleaks",
          label: "🔑 Gitleaks (Secret Scanning)",
          hint: "Detects hardcoded secrets & credentials in git history"
        });
        recommendedSet.add("gitleaks");

        // 2. All Relevant Security Scanner Plugins
        const baseScannersSet = new Set(basePolicy.codeScanning.scanners.map(s => s.tool));
        for (const scanner of ALL_SCANNERS) {
          if (scanner.isApplicable && !scanner.isApplicable(state)) {
            continue;
          }

          if (baseScannersSet.has(scanner.id)) {
            recommendedSet.add(scanner.id);
          }
          const icon = scanner.icon || "🔒";
          scannerOptions.push({
            value: scanner.id,
            label: `${icon} ${scanner.name}`,
            hint: scanner.description || scanner.jobName
          });
        }

        const selectedCustom = await multiselect({
          message: "Toggle Security Modules (Space to toggle, Enter to confirm):",
          options: scannerOptions,
          initialValues: scannerOptions.filter(o => recommendedSet.has(o.value)).map(o => o.value),
          required: false,
          maxItems: 30
        });

        if (isCancel(selectedCustom)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        const selectedSet = new Set(selectedCustom as string[]);

        const selectedScanners: CodeScanningTargetConfig[] = [];
        for (const scanner of ALL_SCANNERS) {
          if (selectedSet.has(scanner.id)) {
            selectedScanners.push({
              tool: scanner.id,
              targetPath: scanner.id === "hadolint" && basePolicy.containerScanning.dockerfiles.length > 0
                ? basePolicy.containerScanning.dockerfiles[0]
                : undefined,
              failOnError: false,
              uploadSarif: true
            });
          }
        }

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
            enabled: selectedScanners.length > 0,
            scanners: selectedScanners
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
      if (securityArtifacts.codeqlYaml) {
        note(securityArtifacts.codeqlYaml, "Generated CodeQL SAST (.github/workflows/codeql.yml)");
      }
      if (securityArtifacts.securityWorkflowYaml) {
        note(securityArtifacts.securityWorkflowYaml, "Generated Security Scans (.github/workflows/security.yml)");
      }
      if (securityArtifacts.codeScanningYaml) {
        note(securityArtifacts.codeScanningYaml, "Generated Code Scanning SAST (.github/workflows/code-scanning.yml)");
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
        if (securityArtifacts.codeScanningYaml) {
          await fs.writeFile(path.join(workflowsDir, "code-scanning.yml"), securityArtifacts.codeScanningYaml, "utf8");
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
      if (securityArtifacts.codeScanningYaml) {
        await fs.writeFile(path.join(targetWorkflowsDir, "code-scanning.yml"), securityArtifacts.codeScanningYaml, "utf8");
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

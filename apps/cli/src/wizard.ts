import { intro, outro, text, multiselect, select, confirm, spinner, note, isCancel, cancel } from "@clack/prompts";
import pc from "picocolors";
import { promises as fs } from "node:fs";
import path from "node:path";
import { scanRepository } from "@zcicd/scanner";
import { planWorkflow } from "@zcicd/planner";
import { resolvePlan } from "@zcicd/resolver";
import { buildWorkflowIR, compileWorkflowYAML } from "@zcicd/compiler";
import { compileSecurityPolicy, type SecurityLevel } from "@zcicd/security";
import { withRepository, isRemoteUrl } from "./git.js";

/**
 * Wizard v1: Minimalist, fast interactive flow with Security Policy support
 */
export async function runInteractiveWizard(): Promise<void> {
  intro(pc.bgCyan(pc.black(" Auto GitHub Actions (auto-gha) ")));

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

  const target = String(targetInput).trim();
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

      const jobOptions = ir.jobs.map(job => ({
        value: job.id,
        label: job.name ?? job.id,
        hint: `runs on ${job.runsOn}${job.needs ? ` (needs: ${job.needs.join(", ")})` : ""}`
      }));

      const selectedJobIds = await multiselect({
        message: "Select the CI/CD jobs you want to generate (Space to toggle, Enter to confirm):",
        options: jobOptions,
        initialValues: jobOptions.map(j => j.value),
        required: true
      });

      if (isCancel(selectedJobIds)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const activeJobIds = new Set(selectedJobIds as string[]);

      const enableCaching = await confirm({
        message: "Enable automatic dependency caching (npm/pnpm/yarn/pip/go/cargo)?",
        initialValue: true
      });

      if (isCancel(enableCaching)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const enableHardening = await confirm({
        message: "Enable production hardening (15m job timeouts & cancel-in-progress concurrency)?",
        initialValue: true
      });

      if (isCancel(enableHardening)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const securityLevelInput = await select({
        message: "Select Security Policy Level:",
        options: [
          { value: "standard", label: "Standard (Recommended)", hint: "CodeQL + Trivy + Dependabot + Audits" },
          { value: "strict", label: "Strict", hint: "Harden-Runner + Gitleaks + Daily Dependabot" },
          { value: "minimal", label: "Minimal", hint: "Dependabot + Native lockfile audits" },
          { value: "none", label: "None", hint: "Skip security configuration" }
        ],
        initialValue: "standard"
      });

      if (isCancel(securityLevelInput)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      const securityLevel = securityLevelInput as SecurityLevel;
      const securityArtifacts = compileSecurityPolicy(state, securityLevel);

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

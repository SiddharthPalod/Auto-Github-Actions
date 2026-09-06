import { intro, outro, text, multiselect, select, confirm, spinner, note, log, isCancel, cancel } from "@clack/prompts";
import pc from "picocolors";
import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { scanRepository } from "@auto-gha/scanner";
import { planWorkflow } from "@auto-gha/planner";
import { resolvePlan } from "@auto-gha/resolver";
import { buildWorkflowIR, compileWorkflowYAML, validateWorkflowIR } from "@auto-gha/compiler";
import { compileSecurityPolicy, type SecurityLevel } from "@auto-gha/security";
import { reconcileWorkflows } from "@auto-gha/reconciliation";
import { withRepository, isRemoteUrl } from "./git.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getRemoteRepoInfo(scanPath: string, targetUrl?: string): { owner: string; repo: string } | null {
  try {
    let url = targetUrl;
    if (!url || !isRemoteUrl(url)) {
      url = execSync("git config --get remote.origin.url", { cwd: scanPath, encoding: "utf8" }).trim();
    }
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

/**
 * Wizard v2: Clean multi-stage compilation pipeline with Unified Git Branching
 */
export async function runInteractiveWizardV2(): Promise<void> {
  console.clear();
  intro(pc.bgCyan(pc.black(" Auto GitHub Actions (auto-gha) ")));

  // 1. Ask for repository target path or URL
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
    s.start(pc.cyan("Analyzing repository..."));

    await withRepository(
      target,
      async (scanPath) => {
        // Step 1: Scanner
        const state = await scanRepository(scanPath);
        s.stop(pc.green("Repository cloned & scanned"));

        log.step(pc.cyan("[1/7] Scanner: Crawled file tree & evaluated runtime detectors"));
        await sleep(150);

        // Step 2: Planner
        const plan = planWorkflow(state);
        const runtimeCount = state.runtime.length;
        const frameworkCount = state.frameworks.length;
        log.step(
          pc.cyan(
            `[2/7] Planner: Deduced ${plan.capabilities.length} capabilities across ${runtimeCount} runtimes & ${frameworkCount} frameworks`
          )
        );
        await sleep(150);

        // Step 3: Resolver
        const resolvedPlan = resolvePlan(plan);
        log.step(
          pc.cyan(
            `[3/7] Resolver: Resolved ${resolvedPlan.primitives.length} primitives from Starter Workflows Catalog`
          )
        );
        await sleep(150);

        // Step 4: Workflow Builder
        const ir = buildWorkflowIR(plan, resolvedPlan);
        log.step(
          pc.cyan(
            `[4/7] Builder: Partitioned primitives into ${ir.jobs.length} parallel jobs in Workflow IR`
          )
        );
        await sleep(150);

        // Step 5: Validation
        const validation = validateWorkflowIR(ir);
        if (!validation.valid) {
          throw new Error(`Workflow validation failed: ${validation.errors[0]?.message}`);
        }
        log.step(pc.cyan("[5/7] Compiler: Validated Execution Graph (DAG) cycle-freedom & safety invariants"));
        await sleep(150);

        // Step 6: Reconciliation Check
        let existingCiYaml: string | null = null;
        try {
          existingCiYaml = await fs.readFile(path.join(scanPath, ".github", "workflows", "ci.yml"), "utf8");
        } catch {
          // No existing workflow
        }
        const reconciliation = reconcileWorkflows(existingCiYaml, ir);
        log.step(
          pc.cyan(
            `[6/7] Reconciliation: ${reconciliation.status.toUpperCase()} (${reconciliation.summary})`
          )
        );
        await sleep(150);

        // Rich Discovered Capabilities & Summary Box
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

        if (state.infrastructure.length > 0) {
          const infra = state.infrastructure.map(i => pc.yellow(i.name)).join(", ");
          summaryItems.push(`  ${pc.bold("Infrastructure:")} ${infra}`);
        }

        summaryItems.push("");
        summaryItems.push(pc.bold("  Planned Policy Actions:"));
        for (const action of plan.actions) {
          summaryItems.push(`    → ${pc.cyan(action.id)}: ${action.reason}`);
        }

        note(summaryItems.join("\n"), "Analyzed Project Architecture");

        if (ir.jobs.length === 0) {
          outro(pc.yellow("No CI/CD actions could be planned for this repository."));
          return;
        }

        // 2. Interactive Job Selection Checkbox list
        const jobOptions = ir.jobs.map(job => {
          const needsTag = job.needs && job.needs.length > 0 ? ` (needs: [${job.needs.join(", ")}])` : "";
          const stepCount = `${job.steps.length} steps`;
          return {
            value: job.id,
            label: `${pc.bold(job.name ?? job.id)}`,
            hint: `${stepCount} on ${job.runsOn}${needsTag}`
          };
        });

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

        // 3. Optimization Pass Toggles
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

        // 4. Security Policy Level Selector
        const securityLevelInput = await select({
          message: "🔒 Select Security Policy Level:",
          options: [
            {
              value: "standard",
              label: "Standard (Recommended)",
              hint: "CodeQL SAST + Container Scans + Dependabot + Audits"
            },
            {
              value: "strict",
              label: "Strict",
              hint: "Harden-Runner + Gitleaks + Daily Dependabot + Zero-tolerance gating"
            },
            {
              value: "minimal",
              label: "Minimal",
              hint: "Dependabot + Native lockfile audits only"
            },
            {
              value: "none",
              label: "None",
              hint: "Skip security configuration"
            }
          ],
          initialValue: "standard"
        });

        if (isCancel(securityLevelInput)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        const securityLevel = securityLevelInput as SecurityLevel;

        log.step(pc.cyan(`[7/7] Security: Compiling security policies for level '${securityLevel}'`));
        const securityArtifacts = compileSecurityPolicy(state, securityLevel);

        // Filter WorkflowIR jobs by user selection
        const filteredJobs = reconciliation.mergedIR.jobs
          .filter(j => activeJobIds.has(j.id))
          .map(j => ({
            ...j,
            needs: j.needs ? j.needs.filter(need => activeJobIds.has(need)) : undefined
          }));

        const filteredIR = {
          ...reconciliation.mergedIR,
          jobs: filteredJobs
        };

        // Phase 5: Compile YAML with chosen optimization passes
        const compiledCiYaml = compileWorkflowYAML(filteredIR, {
          state,
          plan,
          resolved: resolvedPlan,
          options: {
            enableCaching: Boolean(enableCaching),
            enableHardening: Boolean(enableHardening)
          }
        });

        // Show Previews
        note(compiledCiYaml, "Generated Workflow (.github/workflows/ci.yml)");

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

        // Assemble all generated files
        const generatedFiles: Array<{ relativePath: string; content: string }> = [
          { relativePath: ".github/workflows/ci.yml", content: compiledCiYaml }
        ];
        if (securityArtifacts.dependabotYaml) {
          generatedFiles.push({ relativePath: ".github/dependabot.yml", content: securityArtifacts.dependabotYaml });
        }
        if (securityArtifacts.codeqlYaml) {
          generatedFiles.push({ relativePath: ".github/workflows/codeql.yml", content: securityArtifacts.codeqlYaml });
        }
        if (securityArtifacts.securityWorkflowYaml) {
          generatedFiles.push({ relativePath: ".github/workflows/security.yml", content: securityArtifacts.securityWorkflowYaml });
        }
        if (securityArtifacts.codeScanningYaml) {
          generatedFiles.push({ relativePath: ".github/workflows/code-scanning.yml", content: securityArtifacts.codeScanningYaml });
        }

        // 5. Unified Delivery: Git Branching by Default
        const defaultBranchName = `zcicd/setup-ci-${Date.now()}`;
        const deliveryAction = await select({
          message: "How would you like to apply these configurations?",
          options: [
            {
              value: "branch-commit",
              label: `🌿 Create Git Branch & Commit Changes ${pc.green("(Recommended)")}`,
              hint: `Creates branch '${defaultBranchName}' and commits all .github/ files`
            },
            {
              value: "write-only",
              label: "💾 Write files directly without Git branch or commit",
              hint: "Writes .github/ files directly to current working tree"
            },
            {
              value: "preview",
              label: "👁️  Preview only",
              hint: "Exit without writing or committing"
            }
          ],
          initialValue: "branch-commit"
        });

        if (isCancel(deliveryAction) || deliveryAction === "preview") {
          outro(pc.green(`✨ Workflow preview complete!`));
          return;
        }

        // Option A: Write files directly
        if (deliveryAction === "write-only") {
          for (const file of generatedFiles) {
            const fullPath = path.resolve(scanPath, file.relativePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, file.content, "utf8");
          }

          outro(
            pc.green(
              `✨ Successfully wrote all CI/CD and Security files to ${pc.bold(scanPath)}!\n\n` +
              `   Files generated:\n` +
              generatedFiles.map(f => `   ✓ ${f.relativePath}`).join("\n")
            )
          );
          return;
        }

        // Option B: Git Branch & Commit
        const branchInput = await text({
          message: "Enter the Git branch name to create:",
          placeholder: defaultBranchName,
          defaultValue: defaultBranchName,
          validate: (val) => (!val || val.trim() === "" ? "Branch name cannot be empty." : undefined)
        });

        if (isCancel(branchInput)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        const branchName = String(branchInput).trim();
        s.start(pc.cyan(`Creating branch '${branchName}' and committing files...`));

        // Create branch & write files
        execSync(`git checkout -b "${branchName}"`, { cwd: scanPath, stdio: "pipe" });

        for (const file of generatedFiles) {
          const fullPath = path.resolve(scanPath, file.relativePath);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, file.content, "utf8");
        }

        execSync(`git add .github/`, { cwd: scanPath, stdio: "pipe" });
        execSync(
          `git commit -m "ci: add zero-config CI/CD pipeline and security automation"`,
          { cwd: scanPath, stdio: "pipe" }
        );

        s.stop(pc.green(`✅ Created branch ${pc.bold(branchName)} and committed files!`));

        // Push branch?
        const shouldPush = await confirm({
          message: `Push branch '${branchName}' to remote origin and generate 1-click Pull Request link?`,
          initialValue: true
        });

        if (!isCancel(shouldPush) && shouldPush) {
          s.start(pc.cyan(`Pushing branch '${branchName}' to origin...`));
          try {
            execSync(`git push -u origin "${branchName}"`, { cwd: scanPath, stdio: "pipe" });
            s.stop(pc.green("✅ Successfully pushed to origin!"));

            const repoInfo = getRemoteRepoInfo(scanPath, target);
            const prUrl = repoInfo
              ? `https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/new/${branchName}`
              : undefined;

            outro(
              pc.green(
                `🎉 Successfully pushed branch ${pc.bold(pc.cyan(branchName))} to GitHub!\n\n` +
                (prUrl
                  ? `   🔗 ${pc.bold("1-Click Pull Request Creation Link:")}\n      ${pc.underline(pc.bold(prUrl))}\n\n`
                  : "") +
                `   Files committed:\n` +
                generatedFiles.map(f => `   ✓ ${f.relativePath}`).join("\n")
              )
            );
            return;
          } catch (pushErr: any) {
            s.stop(pc.yellow("⚠️  Could not push branch to remote origin."));
            log.warn(pushErr?.message || String(pushErr));
          }
        }

        outro(
          pc.green(
            `✨ Branch ${pc.bold(branchName)} is ready locally!\n\n` +
            `   To publish to GitHub when ready, run:\n` +
            `   git push -u origin ${branchName}`
          )
        );
      },
      (msg) => {
        s.message(pc.cyan(msg));
      }
    );
  } catch (error) {
    s.stop(pc.red("Error occurred"));
    console.error(pc.red(`\n[Error] ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

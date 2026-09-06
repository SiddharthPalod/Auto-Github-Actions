import type { PlannedAction } from "@auto-gha/planner";
import type { ResolvedPrimitive } from "../types.js";
import { STARTER_WORKFLOWS_CATALOG } from "../catalog/starter-workflows.js";

export function resolveDependencyInstall(action: PlannedAction): ResolvedPrimitive[] {
  const manager = action.inputs?.packageManager;
  const customCommand = action.inputs?.customCommand;

  if (typeof customCommand === "string" && customCommand.trim() !== "") {
    return [
      {
        kind: "run",
        run: customCommand,
        reason: action.reason || "Install project dependencies.",
        source: "engine/dependency-install",
        actionId: action.id
      }
    ];
  }

  if (typeof manager !== "string") {
    throw new Error(`dependency.install action "${action.id}" is missing packageManager`);
  }

  switch (manager) {
    case "pnpm":
      return [
        {
          kind: "uses",
          uses: "pnpm/action-setup@v4",
          with: { version: "9" },
          reason: "pnpm package manager setup.",
          source: "pnpm/action-setup@v4",
          actionId: action.id
        }
      ];

    case "npm": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/node.js.yml"];
      const installStep = template.steps.find(s => s.id === "npm-ci");
      return [
        {
          kind: "run",
          run: installStep?.run ?? "npm ci",
          reason: "Install Node.js dependencies with npm according to starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "yarn":
      return [
        {
          kind: "run",
          run: "yarn install --immutable",
          reason: "Install Node.js dependencies with Yarn.",
          source: "actions/starter-workflows:ci/node.js.yml",
          actionId: action.id
        }
      ];

    case "bun":
      return [
        {
          kind: "run",
          run: "bun install --frozen-lockfile",
          reason: "Install Node.js dependencies with Bun.",
          source: "oven-sh/setup-bun@v2",
          actionId: action.id
        }
      ];

    default:
      throw new Error(`Unsupported package manager: ${manager}`);
  }
}

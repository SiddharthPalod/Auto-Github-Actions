import type { PlannedAction } from "@auto-gha/planner";
import type { ResolvedPrimitive } from "./types.js";
import { getPlugin, type StepIR, type ResolverContext } from "@auto-gha/registry";

type ResolverFunction = (action: PlannedAction) => ResolvedPrimitive[];

function toPrimitives(steps: StepIR[], action: PlannedAction): ResolvedPrimitive[] {
  return steps.map(step => {
    if (step.kind === "uses") {
      return {
        kind: "uses",
        uses: step.uses,
        with: step.with,
        reason: action.reason,
        source: step.source ?? action.sourceRule ?? "starter-workflow",
        actionId: action.id
      };
    }
    return {
      kind: "run",
      run: step.run,
      reason: action.reason,
      source: step.source ?? action.sourceRule ?? "starter-workflow",
      actionId: action.id
    };
  });
}

function createDummyContext(action: PlannedAction): ResolverContext {
  return {
    state: {
      runtime: [],
      packageManager: [],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: []
    },
    actionId: action.id,
    source: action.sourceRule
  };
}

export const resolverRegistry: Record<string, ResolverFunction> = {
  "runtime.setup": (action: PlannedAction) => {
    const runtime = action.inputs?.runtime;
    const version = action.inputs?.version;

    if (typeof runtime !== "string") {
      throw new Error(`runtime.setup action "${action.id}" is missing runtime`);
    }

    const plugin = getPlugin(runtime);
    if (!plugin || !plugin.resolvers.setup) {
      throw new Error(`Unsupported runtime: ${runtime}`);
    }

    const ctx: ResolverContext = {
      state: {
        runtime: [{ name: runtime as any, version: typeof version === "string" ? version : undefined, evidence: [] }],
        packageManager: [],
        frameworks: [],
        testing: [],
        tooling: [],
        infrastructure: []
      },
      actionId: action.id
    };

    const steps = plugin.resolvers.setup(ctx);
    return toPrimitives(steps, action);
  },

  "dependency.install": (action: PlannedAction) => {
    const customCommand = action.inputs?.customCommand;
    const pm = action.inputs?.packageManager;

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

    if (pm === "pnpm") {
      return [
        {
          kind: "uses",
          uses: "pnpm/action-setup@v4",
          reason: action.reason,
          source: "pnpm/action-setup@v4",
          actionId: action.id
        }
      ];
    }

    return [];
  },

  "test.unit": (action: PlannedAction) => {
    const customCommand = action.inputs?.customCommand;
    const framework = action.inputs?.framework;

    if (typeof customCommand === "string" && customCommand.trim() !== "") {
      return [
        {
          kind: "run",
          run: customCommand,
          reason: action.reason || "Run unit test suite.",
          source: "engine/test-unit",
          actionId: action.id
        }
      ];
    }

    if (framework === "jest") {
      return [
        {
          kind: "run",
          run: "npm test -- --ci",
          reason: "Run Jest unit tests.",
          source: "actions/starter-workflows:ci/node.js.yml",
          actionId: action.id
        }
      ];
    }

    if (framework === "vitest") {
      return [
        {
          kind: "run",
          run: "npm run test -- --run",
          reason: "Run Vitest unit tests.",
          source: "actions/starter-workflows:ci/node.js.yml",
          actionId: action.id
        }
      ];
    }

    return [
      {
        kind: "run",
        run: "npm test --if-present",
        reason: "Run tests if test script is defined in package.json.",
        source: "engine/test-unit",
        actionId: action.id
      }
    ];
  },

  "test.e2e": (action: PlannedAction) => {
    const customCommand = action.inputs?.customCommand;
    const framework = action.inputs?.framework;

    if (typeof customCommand === "string" && customCommand.trim() !== "") {
      return [
        {
          kind: "run",
          run: customCommand,
          reason: action.reason || "Run end-to-end tests.",
          source: "engine/test-e2e",
          actionId: action.id
        }
      ];
    }

    if (framework === "playwright") {
      return [
        {
          kind: "run",
          run: "npx playwright test",
          reason: "Run Playwright end-to-end tests.",
          source: "microsoft/playwright-github-action",
          actionId: action.id
        }
      ];
    }

    if (framework === "cypress") {
      return [
        {
          kind: "run",
          run: "npx cypress run",
          reason: "Run Cypress end-to-end tests.",
          source: "cypress-io/github-action",
          actionId: action.id
        }
      ];
    }

    throw new Error(`Unsupported E2E testing framework: ${framework}`);
  },

  "docker.build": (action: PlannedAction) => {
    const plugin = getPlugin("docker");
    const ctx = createDummyContext(action);
    ctx.state.infrastructure.push({
      name: "docker",
      evidence: [{ source: typeof action.inputs?.file === "string" ? action.inputs.file : "Dockerfile", value: "" }]
    });
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "go.build": (action: PlannedAction) => {
    const plugin = getPlugin("go");
    const ctx = createDummyContext(action);
    if (action.inputs?.version && action.inputs.version !== "default") {
      ctx.state.runtime.push({ name: "go", version: String(action.inputs.version), evidence: [] });
    }
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "go.test": (action: PlannedAction) => {
    const plugin = getPlugin("go");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "python.test": (action: PlannedAction) => {
    const plugin = getPlugin("python");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "rust.build": (action: PlannedAction) => {
    const plugin = getPlugin("rust");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "rust.test": (action: PlannedAction) => {
    const plugin = getPlugin("rust");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "java.build": (action: PlannedAction) => {
    const plugin = getPlugin("java");
    const ctx = createDummyContext(action);
    if (action.inputs?.tool === "gradle") {
      ctx.state.packageManager.push({ name: "gradle", evidence: [] });
    } else if (action.inputs?.tool === "maven") {
      ctx.state.packageManager.push({ name: "maven", evidence: [] });
    }
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "java.test": (action: PlannedAction) => {
    const plugin = getPlugin("java");
    const ctx = createDummyContext(action);
    if (action.inputs?.tool === "gradle") {
      ctx.state.packageManager.push({ name: "gradle", evidence: [] });
    } else if (action.inputs?.tool === "maven") {
      ctx.state.packageManager.push({ name: "maven", evidence: [] });
    }
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "dotnet.build": (action: PlannedAction) => {
    const plugin = getPlugin("dotnet");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "dotnet.test": (action: PlannedAction) => {
    const plugin = getPlugin("dotnet");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "ruby.test": (action: PlannedAction) => {
    const plugin = getPlugin("ruby");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "php.test": (action: PlannedAction) => {
    const plugin = getPlugin("php");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "dart.test": (action: PlannedAction) => {
    const plugin = getPlugin("dart");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "elixir.test": (action: PlannedAction) => {
    const plugin = getPlugin("elixir");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "cpp.build": (action: PlannedAction) => {
    const plugin = getPlugin("cpp");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "cpp.test": (action: PlannedAction) => {
    const plugin = getPlugin("cpp");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "deno.test": (action: PlannedAction) => {
    const plugin = getPlugin("deno");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  "swift.build": (action: PlannedAction) => {
    const plugin = getPlugin("swift");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.build ? plugin.resolvers.build(ctx) : [], action);
  },

  "swift.test": (action: PlannedAction) => {
    const plugin = getPlugin("swift");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.test ? plugin.resolvers.test(ctx) : [], action);
  },

  // Deployment Resolvers
  "deploy.aws": (action: PlannedAction) => {
    const plugin = getPlugin("aws");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  },

  "deploy.gcp": (action: PlannedAction) => {
    const plugin = getPlugin("gcp");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  },

  "deploy.azure": (action: PlannedAction) => {
    const plugin = getPlugin("azure");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  },

  "deploy.kubernetes": (action: PlannedAction) => {
    const plugin = getPlugin("kubernetes");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  },

  "deploy.terraform": (action: PlannedAction) => {
    const plugin = getPlugin("terraform");
    const ctx = createDummyContext(action);
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  },

  "deploy.ghcr": (action: PlannedAction) => {
    const plugin = getPlugin("ghcr");
    const ctx = createDummyContext(action);
    if (action.inputs?.file) {
      ctx.state.infrastructure.push({
        name: "docker",
        evidence: [{ source: String(action.inputs.file), value: "" }]
      });
    }
    return toPrimitives(plugin?.resolvers.deploy ? plugin.resolvers.deploy(ctx) : [], action);
  }
};

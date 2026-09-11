import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const pythonPlugin: AutoGhaPlugin = {
  id: "python",
  name: "Python",
  type: "language",
  detection: {
    manifests: [
      "pyproject.toml",
      "requirements.txt",
      "Pipfile",
      "setup.py",
      "setup.cfg",
      "environment.yml",
      "poetry.lock",
      "**/requirements.txt",
      "**/pyproject.toml"
    ],
    extensions: [".py"],
    async predicate(context, state) {
      const pythonConfig = context.findFiles(
        f =>
          f.endsWith("pyproject.toml") ||
          f.endsWith("requirements.txt") ||
          f.endsWith("Pipfile") ||
          f.endsWith("setup.py") ||
          f.endsWith("setup.cfg") ||
          f.endsWith("environment.yml") ||
          f.endsWith("poetry.lock")
      );

      if (pythonConfig.length > 0) {
        for (const file of pythonConfig) {
          state.runtime.push({
            name: "python",
            evidence: [{ source: file, value: "Python project detected" }]
          });
        }
      } else {
        const pyFiles = context.findFiles(f => f.endsWith(".py"));
        if (pyFiles.length > 0) {
          state.runtime.push({
            name: "python",
            evidence: pyFiles.slice(0, 5).map(file => ({ source: file, value: "Python source file (.py)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const pythonRuntime = ctx.state.runtime.find(r => r.name === "python");
      return [
        {
          kind: "uses",
          uses: "actions/setup-python@v5",
          with: { "python-version": pythonRuntime?.version ?? "3.x" },
          source: "actions/starter-workflows:ci/python-app.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "actions/setup-python@v5",
          with: { "python-version": "3.x" },
          source: "actions/starter-workflows:ci/python-app.yml"
        },
        {
          kind: "run",
          run: "python -m pip install --upgrade pip pytest && if [ -f requirements.txt ]; then pip install -r requirements.txt; fi && for req in $(find . -name 'requirements.txt' -not -path '*/.*' -not -path './requirements.txt'); do pip install -r \"$req\"; done",
          source: "actions/starter-workflows:ci/python-app.yml"
        },
        {
          kind: "run",
          run: "pytest || [ $? -eq 5 ]",
          source: "actions/starter-workflows:ci/python-app.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-python",
    name: "Python CI",
    category: "test"
  }
};

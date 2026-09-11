import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const phpPlugin: AutoGhaPlugin = {
  id: "php",
  name: "PHP",
  type: "language",
  detection: {
    manifests: ["composer.json", "composer.lock", "**/composer.json"],
    extensions: [".php"],
    async predicate(context, state) {
      const composerFiles = context.findFiles(f => f.endsWith("composer.json"));
      if (composerFiles.length > 0) {
        state.runtime.push({
          name: "php",
          version: "8.2",
          evidence: composerFiles.map(file => ({ source: file, value: "composer.json detected" }))
        });
        state.packageManager.push({
          name: "composer",
          evidence: composerFiles.map(file => ({ source: file, value: "Composer package manager" }))
        });
      } else {
        const phpFiles = context.findFiles(f => f.endsWith(".php"));
        if (phpFiles.length > 0) {
          state.runtime.push({
            name: "php",
            version: "8.2",
            evidence: phpFiles.slice(0, 5).map(file => ({ source: file, value: "PHP source file (.php)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const phpRuntime = ctx.state.runtime.find(r => r.name === "php");
      return [
        {
          kind: "uses",
          uses: "shivammathur/setup-php@v2",
          with: {
            "php-version": phpRuntime?.version ?? "8.2"
          },
          source: "actions/starter-workflows:ci/php.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "composer install -q --no-ansi --no-interaction --no-scripts --no-progress --prefer-dist && (vendor/bin/phpunit || [ $? -eq 0 ])",
          source: "actions/starter-workflows:ci/php.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-php",
    name: "PHP CI",
    category: "test"
  }
};

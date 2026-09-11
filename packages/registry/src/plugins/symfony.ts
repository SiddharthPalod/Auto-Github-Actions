import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const symfonyPlugin: AutoGhaPlugin = {
  id: "symfony",
  name: "Symfony (PHP)",
  type: "framework",
  detection: {
    manifests: ["symfony.lock", "composer.json"],
    async predicate(context, state) {
      const hasSymfonyLock = context.hasFile("symfony.lock");
      const hasComposerJson = context.hasFile("composer.json");
      if (hasSymfonyLock && hasComposerJson) {
        state.frameworks.push({
          name: "symfony",
          evidence: [
            { source: "symfony.lock", value: "symfony.lock detected" },
            { source: "composer.json", value: "composer.json detected" }
          ]
        });
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "shivammathur/setup-php@v2",
          with: {
            php: "8.3",
            extensions: "mbstring, xml, ctype, iconv, intl, pdo_sqlite",
            coverage: "none"
          },
          source: "actions/starter-workflows:ci/symfony.yml"
        },
        {
          kind: "run",
          run: "composer install --prefer-dist --no-progress",
          source: "actions/starter-workflows:ci/symfony.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "uses",
          uses: "shivammathur/setup-php@v2",
          with: {
            php: "8.3",
            extensions: "mbstring, xml, ctype, iconv, intl, pdo_sqlite",
            coverage: "none"
          },
          source: "actions/starter-workflows:ci/symfony.yml"
        },
        {
          kind: "run",
          run: "composer install --prefer-dist --no-progress",
          source: "actions/starter-workflows:ci/symfony.yml"
        },
        {
          kind: "run",
          run: "php bin/phpunit",
          source: "actions/starter-workflows:ci/symfony.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-symfony",
    name: "Symfony CI",
    category: "test"
  }
};

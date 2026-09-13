# Contributing to Auto GitHub Actions

Thanks for being here. Auto GitHub Actions is a zero-configuration CI/CD compiler engine, and it gets better when more people run it, break it, and extend it.

## Getting set up

Use Node.js 18+ and [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/SiddharthPalod/Auto-Github-Actions.git
cd Auto-Github-Actions
pnpm install
pnpm -r build
pnpm -r test
```

Before sending a PR run `pnpm -r build` and `pnpm -r test` — **both must stay green.**

## Good first contributions

The highest-leverage places to jump in:

- **🧩 Add a language or framework plugin.** Create a single vertical plugin in `packages/registry/src/plugins/<name>.ts` implementing `AutoGhaPlugin`, register it in `packages/registry/src/index.ts`, and the scanner/planner/resolver engines pick it up automatically. Use an existing plugin like `go.ts` or `rust.ts` as a template.
- **☁️ Add a deployment target.** Create a deployment plugin in `packages/registry/src/plugins/<target>.ts` with detection manifests and a `deploy` AST resolver. The planner automatically wires DAG dependencies.
- **🛡️ Add a security scanner.** Create a scanner plugin in `packages/security/src/scanners/<scanner>.ts` implementing `ScannerPlugin`, register it in `packages/security/src/scanners/index.ts`. The compiler executes it via a data-driven loop with zero switch statements.
- **⚡ Add an AST optimization pass.** Write a new pass in `packages/compiler/src/passes/` to inspect or mutate the `WorkflowIR` AST before YAML serialization.
- **🐛 Fix bugs / improve the CLI experience.** The wizard lives in `apps/cli/src/wizard.ts` (v1) and `apps/cli/src/wizard2.ts` (v2).

## Architecture in one minute

- **Monorepo with pnpm workspaces.** 9 engine packages + 1 CLI app, built topologically.
- **Data-driven plugin system.** Everything (languages, frameworks, scanners, deployment targets) is a declarative plugin registered via a map — no switch/case blocks, no if/else ladders.
- **Compiler pipeline.** `Scanner → Planner → Resolver → Builder → Optimizer → Security Compiler → Reconciliation` — each phase transforms a typed intermediate representation.
- **Plugin registry** lives in `packages/registry/src/plugins/`. **Scanner registry** lives in `packages/security/src/scanners/`.

## Coding style

- TypeScript, **2-space indent, single quotes, semicolons.**
- JSDoc on exported/public functions.
- Match the surrounding code — comment density, naming, and idiom.
- **No switch/case or if/else ladders.** Use data-driven maps and registries. See the project `README.md` for the extension guide.
- Prefer small, reviewable commits. Conventional-commit-style prefixes (`feat:`, `fix:`, `perf:`, `docs:`) are appreciated but not required.

## Running the CLI locally

```bash
# Interactive wizard (Wizard v2 with live compiler animation)
pnpm --filter auto-gha dev

# Non-interactive inspect mode
pnpm --filter auto-gha dev -- --inspect ../some-project

# Minimalist wizard (v1)
pnpm --filter auto-gha dev -- --v1
```

## Regression testing

The project includes 20 golden snapshot tests in `apps/cli/src/regression.test.ts`. If your change intentionally alters output, update snapshots with:

```bash
pnpm --filter auto-gha test -- -u
```

Then review the snapshot diff before committing.

## Pull requests

1. Branch off `main`.
2. Keep `pnpm -r build` and `pnpm -r test` green.
3. If you add a new plugin or scanner, add a corresponding regression snapshot.
4. Describe what you changed and how you verified it.
5. Keep PRs focused — one feature or fix per PR.

## Reporting issues

- Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template for bugs.
- Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template for new ideas.
- Check existing issues before opening a duplicate.

## Ground rules

- Be decent to each other. Assume good faith, keep it constructive.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Maintainer

Auto GitHub Actions is maintained by [Siddharth Palod](https://github.com/SiddharthPalod).

By contributing, you agree your contributions are licensed under the project's [MIT License](LICENSE).

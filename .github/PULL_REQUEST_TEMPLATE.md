## Description

<!-- Provide a brief description of the changes in this PR. -->

## Type of Change

<!-- Check the relevant option(s): -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 🧩 New plugin (language, framework, deployment target, or scanner)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📖 Documentation update
- [ ] 🧹 Code cleanup / refactor (no functional changes)

## Changes Made

<!-- List the key changes. For plugin additions, specify the plugin type and ID. -->

-

## How to Verify

<!-- How can a reviewer test or verify your changes? -->

1. `pnpm -r build` — all packages compile
2. `pnpm -r test` — all tests pass (including regression snapshots)
3. <!-- Add specific verification steps -->

## Checklist

- [ ] `pnpm -r build` passes
- [ ] `pnpm -r test` passes (snapshots updated if needed with `pnpm --filter auto-gha test -- -u`)
- [ ] No switch/case blocks — data-driven maps and registries only
- [ ] New plugins are registered in the appropriate `index.ts`
- [ ] Documentation updated (if applicable)

## Related Issues

<!-- Link any related issues: Fixes #123, Closes #456 -->

## Screenshots / Output

<!-- If applicable, paste generated YAML output or CLI screenshots. -->

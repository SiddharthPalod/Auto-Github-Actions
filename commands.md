## Installation and Building
pnpm install
pnpm build

## CLI Wizard
pnpm --filter @auto-gha/cli dev 
pnpm --filter @auto-gha/cli dev --v1

## NPM Package running
node apps/cli/dist/index.js

## NPM Publishing
Make sure the version is incremented in package.json
cd apps/cli
npm login
npm publish --access public


## Testing
pnpm --filter @auto-gha/cli dev "../../packages/scanner/fixtures/spotiflix"
pnpm --filter @auto-gha/cli dev "D:\New folder (4)\SidFiles\Projectd\Goofy-Projects\BitTorrent"
pnpm --filter @auto-gha/cli dev "https://github.com/SiddharthPalod/LeetCode"
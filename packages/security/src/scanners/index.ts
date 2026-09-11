import type { ScannerPlugin } from "./types.js";
import { semgrepScanner } from "./semgrep.js";
import { hadolintScanner } from "./hadolint.js";
import { tfsecScanner } from "./tfsec.js";
import { banditScanner } from "./bandit.js";
import { brakemanScanner } from "./brakeman.js";
import { dependencyReviewScanner } from "./dependency-review.js";
import { osvScanner } from "./osv-scanner.js";
import { scorecardScanner } from "./scorecard.js";
import { njsscanScanner } from "./njsscan.js";
import { kubesecScanner } from "./kubesec.js";
import { sobelowScanner } from "./sobelow.js";
import { clippyScanner } from "./clippy.js";
import { flawfinderScanner } from "./flawfinder.js";
import { syftScanner } from "./syft.js";
import { anchoreScanner } from "./anchore.js";
import { checkmarxScanner } from "./checkmarx.js";
import { veracodeScanner } from "./veracode.js";
import { stackhawkScanner } from "./stackhawk.js";
import { sysdigScanner } from "./sysdig.js";
import { synopsysScanner } from "./synopsys.js";
import { zscalerIacScanner } from "./zscaler-iac.js";
import { xanitizerScanner } from "./xanitizer.js";

export * from "./types.js";
export * from "./semgrep.js";
export * from "./hadolint.js";
export * from "./tfsec.js";
export * from "./bandit.js";
export * from "./brakeman.js";
export * from "./dependency-review.js";
export * from "./osv-scanner.js";
export * from "./scorecard.js";
export * from "./njsscan.js";
export * from "./kubesec.js";
export * from "./sobelow.js";
export * from "./clippy.js";
export * from "./flawfinder.js";
export * from "./syft.js";
export * from "./anchore.js";
export * from "./checkmarx.js";
export * from "./veracode.js";
export * from "./stackhawk.js";
export * from "./sysdig.js";
export * from "./synopsys.js";
export * from "./zscaler-iac.js";
export * from "./xanitizer.js";

export const ALL_SCANNERS: ScannerPlugin[] = [
  semgrepScanner,
  hadolintScanner,
  tfsecScanner,
  banditScanner,
  brakemanScanner,
  dependencyReviewScanner,
  osvScanner,
  scorecardScanner,
  njsscanScanner,
  kubesecScanner,
  sobelowScanner,
  clippyScanner,
  flawfinderScanner,
  syftScanner,
  anchoreScanner,
  checkmarxScanner,
  veracodeScanner,
  stackhawkScanner,
  sysdigScanner,
  synopsysScanner,
  zscalerIacScanner,
  xanitizerScanner
];

const scannerMap = new Map<string, ScannerPlugin>(
  ALL_SCANNERS.map(scanner => [scanner.id, scanner])
);

export function getScanner(id: string): ScannerPlugin | undefined {
  return scannerMap.get(id);
}

import type { ProjectState } from "@auto-gha/state";
import { createRepositoryContext } from "./context.js";

import { nodeDetector } from "./detectors/node.js";
import { dockerDetector } from "./detectors/docker.js";
import { pythonDetector } from "./detectors/python.js";
import { goDetector } from "./detectors/go.js";
import { rustDetector } from "./detectors/rust.js";
import { javaDetector } from "./detectors/java.js";
import { dotnetDetector } from "./detectors/dotnet.js";
import { rubyDetector } from "./detectors/ruby.js";
import { phpDetector } from "./detectors/php.js";
import { dartDetector } from "./detectors/dart.js";
import { elixirDetector } from "./detectors/elixir.js";
import { cppDetector } from "./detectors/cpp.js";
import { denoDetector } from "./detectors/deno.js";
import { swiftDetector } from "./detectors/swift.js";

import { awsDetector } from "./detectors/aws.js";
import { gcpDetector } from "./detectors/gcp.js";
import { azureDetector } from "./detectors/azure.js";
import { k8sDetector } from "./detectors/k8s.js";
import { terraformDetector } from "./detectors/terraform.js";

const detectors = [
  nodeDetector,
  pythonDetector,
  goDetector,
  dockerDetector,
  rustDetector,
  javaDetector,
  dotnetDetector,
  rubyDetector,
  phpDetector,
  dartDetector,
  elixirDetector,
  cppDetector,
  denoDetector,
  swiftDetector,
  awsDetector,
  gcpDetector,
  azureDetector,
  k8sDetector,
  terraformDetector
];

export async function scanRepository(root: string): Promise<ProjectState> {
  const context = await createRepositoryContext(root);

  const state: ProjectState = {
    runtime: [],
    packageManager: [],
    frameworks: [],
    testing: [],
    tooling: [],
    infrastructure: []
  };

  for (const detector of detectors) {
    await detector.detect(context, state);
  }

  return state;
}
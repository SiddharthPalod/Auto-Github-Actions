import type { AutoGhaPlugin } from "./types.js";
import { nodePlugin } from "./plugins/node.js";
import { pythonPlugin } from "./plugins/python.js";
import { goPlugin } from "./plugins/go.js";
import { rustPlugin } from "./plugins/rust.js";
import { javaPlugin } from "./plugins/java.js";
import { dotnetPlugin } from "./plugins/dotnet.js";
import { rubyPlugin } from "./plugins/ruby.js";
import { phpPlugin } from "./plugins/php.js";
import { dartPlugin } from "./plugins/dart.js";
import { elixirPlugin } from "./plugins/elixir.js";
import { cppPlugin } from "./plugins/cpp.js";
import { denoPlugin } from "./plugins/deno.js";
import { swiftPlugin } from "./plugins/swift.js";
import { dockerPlugin } from "./plugins/docker.js";
import { testingPlugin } from "./plugins/testing.js";
import { awsPlugin } from "./plugins/aws.js";
import { gcpPlugin } from "./plugins/gcp.js";
import { azurePlugin } from "./plugins/azure.js";
import { kubernetesPlugin } from "./plugins/kubernetes.js";
import { terraformPlugin } from "./plugins/terraform.js";
import { ghcrPlugin } from "./plugins/ghcr.js";
import { scalaPlugin } from "./plugins/scala.js";
import { rPlugin } from "./plugins/r.js";
import { symfonyPlugin } from "./plugins/symfony.js";
import { webpackPlugin } from "./plugins/webpack.js";
import { superLinterPlugin } from "./plugins/super-linter.js";
import { ibmPlugin } from "./plugins/ibm.js";
import { openshiftPlugin } from "./plugins/openshift.js";
import { tencentPlugin } from "./plugins/tencent.js";
import { octopusdeployPlugin } from "./plugins/octopusdeploy.js";
import { stackhawkPlugin } from "./plugins/stackhawk.js";

export * from "./types.js";
export * from "./plugins/node.js";
export * from "./plugins/python.js";
export * from "./plugins/go.js";
export * from "./plugins/rust.js";
export * from "./plugins/java.js";
export * from "./plugins/dotnet.js";
export * from "./plugins/ruby.js";
export * from "./plugins/php.js";
export * from "./plugins/dart.js";
export * from "./plugins/elixir.js";
export * from "./plugins/cpp.js";
export * from "./plugins/deno.js";
export * from "./plugins/swift.js";
export * from "./plugins/docker.js";
export * from "./plugins/testing.js";
export * from "./plugins/aws.js";
export * from "./plugins/gcp.js";
export * from "./plugins/azure.js";
export * from "./plugins/kubernetes.js";
export * from "./plugins/terraform.js";
export * from "./plugins/ghcr.js";
export * from "./plugins/scala.js";
export * from "./plugins/r.js";
export * from "./plugins/symfony.js";
export * from "./plugins/webpack.js";
export * from "./plugins/super-linter.js";
export * from "./plugins/ibm.js";
export * from "./plugins/openshift.js";
export * from "./plugins/tencent.js";
export * from "./plugins/octopusdeploy.js";
export * from "./plugins/stackhawk.js";

export const ALL_PLUGINS: AutoGhaPlugin[] = [
  nodePlugin,
  pythonPlugin,
  goPlugin,
  rustPlugin,
  javaPlugin,
  dotnetPlugin,
  rubyPlugin,
  phpPlugin,
  dartPlugin,
  elixirPlugin,
  cppPlugin,
  denoPlugin,
  swiftPlugin,
  dockerPlugin,
  testingPlugin,
  awsPlugin,
  gcpPlugin,
  azurePlugin,
  kubernetesPlugin,
  terraformPlugin,
  ghcrPlugin,
  scalaPlugin,
  rPlugin,
  symfonyPlugin,
  webpackPlugin,
  superLinterPlugin,
  ibmPlugin,
  openshiftPlugin,
  tencentPlugin,
  octopusdeployPlugin,
  stackhawkPlugin
];


const pluginMap = new Map<string, AutoGhaPlugin>(
  ALL_PLUGINS.map(plugin => [plugin.id, plugin])
);

export function getPlugin(id: string): AutoGhaPlugin | undefined {
  return pluginMap.get(id);
}

export function getAllPlugins(): AutoGhaPlugin[] {
  return [...ALL_PLUGINS];
}

export function getPluginsByType(type: AutoGhaPlugin["type"]): AutoGhaPlugin[] {
  return ALL_PLUGINS.filter(p => p.type === type);
}


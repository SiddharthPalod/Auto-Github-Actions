import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const awsPlugin: AutoGhaPlugin = {
  id: "aws",
  name: "AWS ECS",
  type: "deployment",
  detection: {
    manifests: ["task-definition.json", "ecs-params.yml", "samconfig.toml", "**/.aws/*", "**/task-definition.json"],
    async predicate(context, state) {
      const awsFiles = context.findFiles(f => {
        const lower = f.toLowerCase();
        return (
          lower.endsWith("task-definition.json") ||
          lower.endsWith("ecs-params.yml") ||
          lower.endsWith("samconfig.toml") ||
          lower.includes(".aws/")
        );
      });

      if (awsFiles.length > 0) {
        state.infrastructure.push({
          name: "aws",
          evidence: awsFiles.map(file => ({
            source: file,
            value: "AWS deployment configuration detected"
          }))
        });
      }
    }
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          id: "aws-auth",
          name: "Configure AWS credentials",
          kind: "uses",
          uses: "aws-actions/configure-aws-credentials@v4",
          with: {
            "aws-access-key-id": "${{ secrets.AWS_ACCESS_KEY_ID }}",
            "aws-secret-access-key": "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
            "aws-region": "${{ vars.AWS_REGION || 'us-east-1' }}"
          },
          source: "actions/starter-workflows:deployments/aws.yml"
        },
        {
          id: "aws-ecr-login",
          name: "Login to Amazon ECR",
          kind: "uses",
          uses: "aws-actions/amazon-ecr-login@v2",
          source: "actions/starter-workflows:deployments/aws.yml"
        },
        {
          id: "aws-ecs-deploy",
          name: "Deploy Amazon ECS task definition",
          kind: "uses",
          uses: "aws-actions/amazon-ecs-deploy-task-definition@v2",
          with: {
            "task-definition": "task-definition.json",
            service: "${{ vars.ECS_SERVICE }}",
            cluster: "${{ vars.ECS_CLUSTER }}",
            "wait-for-service-stability": true
          },
          source: "actions/starter-workflows:deployments/aws.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-aws",
    name: "Deploy to Amazon ECS",
    category: "deploy"
  }
};

import type { AWS } from "@serverless/typescript";

import slack from "@functions/slack";

const serverlessConfiguration: AWS = {
  service: "times-all",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
  },
  plugins: ["serverless-webpack", "serverless-dotenv-plugin"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
      SLACK_BOT_TOKEN: process.env.SLACK_SIGNING_SECRET,
      AGGREGATE_CHANNEL_ID: process.env.AGGREGATE_CHANNEL_ID,
    },
    lambdaHashingVersion: "20201221",
  },
  // import the function via paths
  functions: { slack },
};

module.exports = serverlessConfiguration;

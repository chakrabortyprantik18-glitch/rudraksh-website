import serverless from "serverless-http";
import path from "node:path";
import { createRequire } from "node:module";

const projectRoot = process.cwd();
const require = createRequire(
  path.join(projectRoot, "package.json")
);

const app = require(
  path.join(projectRoot, "backend", "server.js")
);

export const handler = serverless(app);
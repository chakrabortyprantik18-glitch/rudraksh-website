
import serverless from "serverless-http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const require = createRequire(
  path.join(projectRoot, "package.json")
);

const app = require(
  path.join(projectRoot, "backend", "server.js")
);

export const handler = serverless(app);

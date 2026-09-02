import app from "./app.js";
import { logger } from "./lib/logger.js";
import { seedDefaultUsers } from "./seed.js";

const rawPort = process.env["PORT"];
// Default to 3000 when PORT is not set (e.g. running locally outside Replit).
// Render and most cloud platforms inject PORT automatically.
const port = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

seedDefaultUsers().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});

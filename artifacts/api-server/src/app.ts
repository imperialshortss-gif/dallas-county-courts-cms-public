import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import ConnectPgSimple from "connect-pg-simple";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

const isProduction = process.env["NODE_ENV"] === "production";

// Trust Render's (and similar platforms') reverse proxy so that
// req.ip and secure cookies work correctly behind HTTPS termination.
if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"] || "dallas-probate-cms-secret-2024";

// Use a PostgreSQL-backed session store in production so sessions survive
// server restarts. Falls back to MemoryStore in development (Replit).
const PgStore = ConnectPgSimple(session);
const sessionStore =
  isProduction && process.env["DATABASE_URL"]
    ? new PgStore({
        conString: process.env["DATABASE_URL"],
        createTableIfMissing: false,
      })
    : undefined;

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // Require HTTPS-only cookies in production (Render always uses HTTPS).
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use("/api", router);

// In production, serve the built React frontend and fall back to index.html
// for client-side routing (SPA). In development, Vite's own dev server
// handles the frontend — Express only serves the API.
if (isProduction) {
  const frontendDist = path.join(process.cwd(), "artifacts", "probate-cms", "dist", "public");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("/*splat", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    logger.warn({ frontendDist }, "Frontend build directory not found — static serving skipped");
  }
}

export default app;

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import streakRoutes from "./routes/streak.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Trust the reverse proxy used by Render.
app.set("trust proxy", 1);

app.use(helmet());

// Allow the deployed frontend and configured development/production origins.
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  "https://ve-loop-daily-streak.vercel.app",
  "http://localhost:5173",
  ...configuredOrigins,
]);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (e.g. server-to-server/health checks).
    if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "20kb" }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "veloop-daily-streak-api",
  });
});

// Keep the existing API route prefixes unchanged.
app.use("/api/auth", authRoutes);
app.use("/api/daily-streak", streakRoutes);
app.use("/api/wallet", walletRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Route not found.",
  });
});

app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "SECURITY WARNING: JWT_SECRET should be at least 32 characters."
  );
}

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
  });
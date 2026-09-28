import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  claimController,
  getStreakController,
  getStatusController,
  historyController
} from "../controllers/streak.controller.js";

const router = Router();

const claimLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "TOO_MANY_REQUESTS",
    message: "Too many claim attempts. Please wait a minute before trying again."
  }
});

function requireEmptyClaimBody(req, res, next) {
  const bodyKeys = req.body && typeof req.body === "object" ? Object.keys(req.body) : [];
  const queryKeys = req.query && typeof req.query === "object" ? Object.keys(req.query) : [];

  if (bodyKeys.length > 0 || queryKeys.length > 0) {
    return res.status(400).json({
      success: false,
      code: "UNTRUSTED_CLAIM_INPUT",
      message: "Claim day, reward and user identity are strictly controlled by the server."
    });
  }

  next();
}

router.use(requireAuth);
router.get("/", getStreakController);
router.get("/status", getStatusController);
router.post("/claim", claimLimiter, requireEmptyClaimBody, claimController);
router.get("/history", historyController);

export default router;


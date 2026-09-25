import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  claimController,
  getStreakController,
  getStatusController,
  historyController
} from "../controllers/streak.controller.js";

const router = Router();

function requireEmptyClaimBody(req, res, next) {
  const keys = req.body && typeof req.body === "object" ? Object.keys(req.body) : [];

  if (keys.length > 0) {
    return res.status(400).json({
      success: false,
      code: "UNTRUSTED_CLAIM_INPUT",
      message: "Claim day, reward and user identity are controlled by the server."
    });
  }

  next();
}

router.use(requireAuth);
router.get("/", getStreakController);
router.get("/status", getStatusController);
router.post("/claim", requireEmptyClaimBody, claimController);
router.get("/history", historyController);

export default router;

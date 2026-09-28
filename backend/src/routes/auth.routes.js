import { Router } from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import { loginController, meController, registerController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "TOO_MANY_REQUESTS",
    message: "Too many authentication attempts. Please try again after 15 minutes."
  }
});

const registerRules = [
  body("name").isString().trim().isLength({ min: 2, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 128 })
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 128 })
];

router.post("/register", authLimiter, registerRules, registerController);
router.post("/login", authLimiter, loginRules, loginController);
router.get("/me", requireAuth, meController);

export default router;


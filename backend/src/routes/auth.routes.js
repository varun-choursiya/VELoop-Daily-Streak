import { Router } from "express";
import { body } from "express-validator";
import { loginController, meController, registerController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const registerRules = [
  body("name").isString().trim().isLength({ min: 2, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 128 })
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 128 })
];

router.post("/register", registerRules, registerController);
router.post("/login", loginRules, loginController);
router.get("/me", requireAuth, meController);

export default router;

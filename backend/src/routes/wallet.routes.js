import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { walletController, walletTransactionsController } from "../controllers/wallet.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", walletController);
router.get("/transactions", walletTransactionsController);

export default router;

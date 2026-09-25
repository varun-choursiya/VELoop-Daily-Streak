import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

export async function walletController(req, res, next) {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id }).lean();
    res.json({
      success: true,
      wallet: {
        vesBalance: wallet?.vesBalance || 0,
        amazonGiftCardBalanceInr: wallet?.amazonGiftCardBalanceInr || 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function walletTransactionsController(req, res, next) {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
}

import mongoose from "mongoose";

const streakClaimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StreakCycle",
      required: true,
      index: true
    },
    day: {
      type: Number,
      required: true
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StreakReward",
      required: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "REVERSED"],
      default: "SUCCESS"
    },
    claimedAt: {
      type: Date,
      required: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      required: true
    }
  },
  { timestamps: true }
);

streakClaimSchema.index(
  { userId: 1, cycleId: 1, day: 1 },
  { unique: true }
);

export default mongoose.model("StreakClaim", streakClaimSchema);

import mongoose from "mongoose";

const streakRewardSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1
    },
    rewardType: {
      type: String,
      enum: ["VES", "AMAZON_GIFT_CARD"],
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ""
    },
    assetType: {
      type: String,
      enum: ["coin", "gift-card", "crown"],
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

streakRewardSchema.index({ day: 1 }, { unique: true });

export default mongoose.model("StreakReward", streakRewardSchema);

import mongoose from "mongoose";

const streakCycleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    cycleNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "RESET"],
      default: "ACTIVE"
    },
    currentDay: {
      type: Number,
      default: 1
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastClaimAt: {
      type: Date,
      default: null
    },
    nextClaimAt: {
      type: Date,
      default: null
    },
    windowExpiresAt: {
      type: Date,
      default: null
    },
    resetReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

streakCycleSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

export default mongoose.model("StreakCycle", streakCycleSchema);

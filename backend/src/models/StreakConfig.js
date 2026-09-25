import mongoose from "mongoose";

const streakConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "DAILY_STREAK",
      unique: true
    },
    totalDays: {
      type: Number,
      default: 7,
      min: 1
    },
    claimIntervalHours: {
      type: Number,
      default: 24,
      min: 1
    },
    claimWindowHours: {
      type: Number,
      default: 24,
      min: 1
    },
    resetOnMissedDay: {
      type: Boolean,
      default: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("StreakConfig", streakConfigSchema);

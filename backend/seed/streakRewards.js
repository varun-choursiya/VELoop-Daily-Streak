import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import StreakConfig from "../src/models/StreakConfig.js";
import StreakReward from "../src/models/StreakReward.js";

const rewards = [
  {
    day: 1,
    rewardType: "VES",
    currency: "VES",
    amount: 5,
    title: "Daily Reward",
    subtitle: "5 VEs",
    assetType: "coin"
  },
  {
    day: 2,
    rewardType: "VES",
    currency: "VES",
    amount: 10,
    title: "Daily Reward",
    subtitle: "10 VEs",
    assetType: "coin"
  },
  {
    day: 3,
    rewardType: "VES",
    currency: "VES",
    amount: 15,
    title: "Daily Reward",
    subtitle: "15 VEs",
    assetType: "coin"
  },
  {
    day: 4,
    rewardType: "AMAZON_GIFT_CARD",
    currency: "INR",
    amount: 1,
    title: "Amazon Gift Card",
    subtitle: "₹1 Amazon Gift Card",
    assetType: "gift-card"
  },
  {
    day: 5,
    rewardType: "AMAZON_GIFT_CARD",
    currency: "INR",
    amount: 2,
    title: "Amazon Gift Card",
    subtitle: "₹2 Amazon Gift Card",
    assetType: "gift-card"
  },
  {
    day: 6,
    rewardType: "VES",
    currency: "VES",
    amount: 30,
    title: "Daily Reward",
    subtitle: "30 VEs",
    assetType: "coin"
  },
  {
    day: 7,
    rewardType: "AMAZON_GIFT_CARD",
    currency: "INR",
    amount: 5,
    title: "Ultimate Reward",
    subtitle: "₹5 Amazon Gift Card",
    assetType: "crown"
  }
];

await connectDB();

await StreakConfig.findOneAndUpdate(
  { key: "DAILY_STREAK" },
  {
    key: "DAILY_STREAK",
    totalDays: 7,
    claimIntervalHours: 24,
    claimWindowHours: 24,
    resetOnMissedDay: true,
    active: true
  },
  { upsert: true, new: true }
);

for (const reward of rewards) {
  await StreakReward.findOneAndUpdate(
    { day: reward.day },
    { ...reward, active: true },
    { upsert: true, new: true }
  );
}

console.log("Streak configuration and 7 rewards seeded.");
await mongoose.disconnect();

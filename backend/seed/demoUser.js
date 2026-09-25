import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import Wallet from "../src/models/Wallet.js";

const email = (process.env.DEMO_EMAIL || "demo@veloop.local").toLowerCase().trim();
const password = process.env.DEMO_PASSWORD || "Demo@12345";
const name = process.env.DEMO_NAME || "VELoop Demo";

await connectDB();

const passwordHash = await bcrypt.hash(password, 12);
const user = await User.findOneAndUpdate(
  { email },
  { name, email, passwordHash },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

await Wallet.findOneAndUpdate(
  { userId: user._id },
  { $setOnInsert: { userId: user._id } },
  { upsert: true, new: true }
);

console.log(`Demo user ready: ${email}`);
console.log(`Demo password: ${password}`);
await mongoose.disconnect();

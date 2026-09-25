import "dotenv/config";
import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Wallet from "../src/models/Wallet.js";
import WalletTransaction from "../src/models/WalletTransaction.js";
import StreakCycle from "../src/models/StreakCycle.js";
import StreakClaim from "../src/models/StreakClaim.js";
import AuditLog from "../src/models/AuditLog.js";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

describe("Daily Streak Rewards API & Security Suite", () => {
  let testUser = null;
  let testToken = null;
  let concurrentUser = null;
  let concurrentToken = null;
  const createdUserIds = [];

  before(async () => {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment");
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  after(async () => {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await Wallet.deleteMany({ userId: { $in: createdUserIds } });
      await WalletTransaction.deleteMany({ userId: { $in: createdUserIds } });
      await StreakCycle.deleteMany({ userId: { $in: createdUserIds } });
      await StreakClaim.deleteMany({ userId: { $in: createdUserIds } });
      await AuditLog.deleteMany({ userId: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
  });

  test("1. Unauthenticated streak status request is rejected with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/daily-streak`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "AUTH_REQUIRED");
  });

  test("2. Unauthenticated claim request is rejected with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/daily-streak/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "AUTH_REQUIRED");
  });

  test("3. Request with invalid or malformed JWT token is rejected with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/daily-streak`, {
      headers: { Authorization: "Bearer bad.token.here" }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "AUTH_INVALID");
  });

  test("4. User registration and initial streak status retrieval", async () => {
    const email = `test_streak_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Runner",
        email,
        password: "Password123!"
      })
    });

    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    assert.equal(regBody.success, true);
    assert.ok(regBody.token);
    assert.ok(regBody.user.id);

    testUser = regBody.user;
    testToken = regBody.token;
    createdUserIds.push(testUser.id);

    const statusRes = await fetch(`${BASE_URL}/api/daily-streak`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(statusRes.status, 200);
    const statusBody = await statusRes.json();

    assert.equal(statusBody.success, true);
    assert.ok(statusBody.serverTime);
    assert.equal(statusBody.streak.currentStreak, 0);
    assert.equal(statusBody.streak.currentDay, 1);
    assert.equal(statusBody.streak.checkedIn, 0);
    assert.equal(statusBody.streak.totalRewards, 7);
    assert.equal(statusBody.rewards.length, 7);

    assert.equal(statusBody.rewards[0].day, 1);
    assert.equal(statusBody.rewards[0].status, "AVAILABLE");
    assert.equal(statusBody.rewards[0].reward.amount, 5);
    assert.equal(statusBody.rewards[0].reward.type, "VES");

    for (let i = 1; i < 7; i++) {
      assert.equal(statusBody.rewards[i].status, "LOCKED");
    }
  });

  test("5. Claim ignores client-supplied fake parameters (userId, day, reward amount)", async () => {
    const fakeClaimRes = await fetch(`${BASE_URL}/api/daily-streak/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        userId: "650000000000000000000000",
        day: 7,
        amount: 9999,
        currency: "VES",
        rewardType: "VES"
      })
    });

    assert.equal(fakeClaimRes.status, 200);
    const claimBody = await fakeClaimRes.json();
    assert.equal(claimBody.success, true);
    assert.equal(claimBody.reward.day, 1);
    assert.equal(claimBody.reward.amount, 5);
    assert.equal(claimBody.reward.currency, "VES");
  });

  test("6. Wallet balance updated and WalletTransaction recorded atomically", async () => {
    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(walletRes.status, 200);
    const walletBody = await walletRes.json();
    assert.equal(walletBody.success, true);
    assert.equal(walletBody.wallet.vesBalance, 5);

    const txRes = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(txRes.status, 200);
    const txBody = await txRes.json();
    assert.equal(txBody.success, true);
    assert.equal(txBody.transactions.length, 1);

    const tx = txBody.transactions[0];
    assert.equal(tx.amount, 5);
    assert.equal(tx.currency, "VES");
    assert.equal(tx.type, "CREDIT");
    assert.equal(tx.source, "DAILY_STREAK");
    assert.equal(tx.streakDay, 1);
    assert.equal(tx.balanceBefore, 0);
    assert.equal(tx.balanceAfter, 5);
    assert.equal(tx.status, "SUCCESS");

    const historyRes = await fetch(`${BASE_URL}/api/daily-streak/history`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(historyRes.status, 200);
    const historyBody = await historyRes.json();
    assert.equal(historyBody.success, true);
    assert.equal(historyBody.history.length, 1);
    assert.equal(historyBody.history[0].day, 1);
  });

  test("7. Duplicate claim attempt is rejected with 409", async () => {
    const dupRes = await fetch(`${BASE_URL}/api/daily-streak/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`
      }
    });

    assert.equal(dupRes.status, 409);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.success, false);
    assert.ok(["STREAK_LOCKED", "ALREADY_CLAIMED"].includes(dupBody.code));

    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const walletBody = await walletRes.json();
    assert.equal(walletBody.wallet.vesBalance, 5);
  });

  test("8. Streak progression and locked-day protection", async () => {
    const statusRes = await fetch(`${BASE_URL}/api/daily-streak`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const statusBody = await statusRes.json();

    assert.equal(statusBody.streak.currentStreak, 1);
    assert.equal(statusBody.streak.currentDay, 2);
    assert.equal(statusBody.streak.checkedIn, 1);
    assert.ok(statusBody.streak.nextClaimAt);

    assert.equal(statusBody.rewards[0].status, "CLAIMED");
    assert.equal(statusBody.rewards[1].status, "LOCKED");

    const claimRes = await fetch(`${BASE_URL}/api/daily-streak/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`
      }
    });
    assert.equal(claimRes.status, 409);
    const claimBody = await claimRes.json();
    assert.equal(claimBody.code, "STREAK_LOCKED");
  });

  test("9. Concurrent claim attempts cannot double-credit wallet", async () => {
    const email = `test_concurrent_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Concurrent Tester",
        email,
        password: "Password123!"
      })
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    concurrentUser = regBody.user;
    concurrentToken = regBody.token;
    createdUserIds.push(concurrentUser.id);

    const promises = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/daily-streak/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${concurrentToken}`
        }
      })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 200).length;
    const rejectedCount = statuses.filter((s) => s === 409).length;

    assert.equal(successCount, 1, `Expected exactly 1 success, got ${successCount}`);
    assert.equal(rejectedCount, 4, `Expected 4 rejected, got ${rejectedCount}`);

    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${concurrentToken}` }
    });
    const walletBody = await walletRes.json();
    assert.equal(walletBody.wallet.vesBalance, 5);

    const txRes = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      headers: { Authorization: `Bearer ${concurrentToken}` }
    });
    const txBody = await txRes.json();
    assert.equal(txBody.transactions.length, 1);
  });
});

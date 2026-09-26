import mongoose from "mongoose";
import StreakConfig from "../models/StreakConfig.js";
import StreakReward from "../models/StreakReward.js";
import StreakCycle from "../models/StreakCycle.js";
import StreakClaim from "../models/StreakClaim.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AuditLog from "../models/AuditLog.js";
import { HttpError } from "../utils/httpError.js";
import { makeReference } from "../utils/ids.js";

export async function getConfig(session = null) {
  const config = await StreakConfig.findOne({ key: "DAILY_STREAK", active: true }).session(session);
  if (!config) {
    throw new HttpError(500, "Streak configuration is unavailable.", "CONFIG_ERROR");
  }
  return config;
}

export async function getOrCreateActiveCycle(userId, session = null) {
  let cycle = await StreakCycle.findOne({ userId, status: "ACTIVE" })
    .sort({ cycleNumber: -1 })
    .session(session);

  if (cycle) return cycle;

  const last = await StreakCycle.findOne({ userId })
    .sort({ cycleNumber: -1 })
    .session(session);

  try {
    const created = await StreakCycle.create(
      [
        {
          userId,
          cycleNumber: (last?.cycleNumber || 0) + 1,
          status: "ACTIVE",
          currentDay: 1,
          currentStreak: 0
        }
      ],
      { session }
    );
    return created[0];
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await StreakCycle.findOne({ userId, status: "ACTIVE" })
        .sort({ cycleNumber: -1 })
        .session(session);
      if (existing) return existing;
    }
    throw error;
  }
}

async function resetCycleAndCreateNew(userId, oldCycle, reason, session) {
  oldCycle.status = "RESET";
  oldCycle.resetReason = reason;
  await oldCycle.save({ session });

  const nextNumber = oldCycle.cycleNumber + 1;
  const created = await StreakCycle.create(
    [
      {
        userId,
        cycleNumber: nextNumber,
        status: "ACTIVE",
        currentDay: 1,
        currentStreak: 0
      }
    ],
    { session }
  );

  await AuditLog.create(
    [
      {
        userId,
        event: "STREAK_RESET",
        metadata: {
          previousCycleId: oldCycle._id,
          newCycleId: created[0]._id,
          reason
        }
      }
    ],
    { session }
  );

  return created[0];
}

async function maybeResetMissedCycle(userId, cycle, config, now, session) {
  if (
    config.resetOnMissedDay &&
    cycle.currentDay > 1 &&
    cycle.windowExpiresAt &&
    now > cycle.windowExpiresAt
  ) {
    return resetCycleAndCreateNew(userId, cycle, "REQUIRED_CLAIM_WINDOW_MISSED", session);
  }
  return cycle;
}

export async function getStreakStatus(userId, options = {}) {
  const { session = null, now = new Date() } = options;
  const config = await getConfig(session);

  let cycle = await getOrCreateActiveCycle(userId, session);
  const cycleBeforeReset = cycle;
  cycle = await maybeResetMissedCycle(userId, cycle, config, now, session);
  const wasReset = cycle._id.toString() !== cycleBeforeReset._id.toString();

  const rewards = await StreakReward.find({ active: true })
    .sort({ day: 1 })
    .session(session)
    .lean();

  const wallet = await Wallet.findOne({ userId })
    .session(session)
    .lean();

  const claims = await StreakClaim.find({
    userId,
    cycleId: cycle._id,
    status: "SUCCESS"
  })
    .session(session)
    .lean();

  const claimMap = new Map(claims.map((claim) => [claim.day, claim]));

  let currentStatus = "LOCKED";
  let nextClaimAt = cycle.nextClaimAt;

  if (cycle.currentDay === 1 && !claimMap.has(1)) {
    currentStatus = "AVAILABLE";
    nextClaimAt = null;
  } else if (
    cycle.currentDay >= 1 &&
    cycle.currentDay <= config.totalDays &&
    cycle.nextClaimAt &&
    now >= cycle.nextClaimAt &&
    (!cycle.windowExpiresAt || now <= cycle.windowExpiresAt)
  ) {
    currentStatus = "AVAILABLE";
  }

  const cards = rewards.map((reward) => {
    let status = "LOCKED";

    if (claimMap.has(reward.day)) {
      status = "CLAIMED";
    } else if (reward.day === cycle.currentDay) {
      status = currentStatus;
    } else if (reward.day < cycle.currentDay) {
      status = "MISSED";
    }

    return {
      day: reward.day,
      status,
      reward: {
        type: reward.rewardType,
        currency: reward.currency,
        amount: reward.amount,
        title: reward.title,
        subtitle: reward.subtitle,
        assetType: reward.assetType
      },
      ...(reward.day === cycle.currentDay && nextClaimAt
        ? { nextClaimAt: nextClaimAt.toISOString() }
        : {})
    };
  });

  const nextReward = rewards.find((reward) => reward.day === cycle.currentDay) || null;
  const ultimateReward = rewards.find((reward) => reward.day === config.totalDays) || null;

  return {
    success: true,
    serverTime: now.toISOString(),
    wallet: {
      vesBalance: wallet?.vesBalance ?? 0,
      amazonGiftCardBalanceInr: wallet?.amazonGiftCardBalanceInr ?? 0
    },
    streak: {
      currentStreak: cycle.currentStreak,
      currentDay: cycle.currentDay,
      checkedIn: claims.length,
      totalRewards: config.totalDays,
      status: cycle.status,
      nextClaimAt: nextClaimAt ? nextClaimAt.toISOString() : null,
      wasReset,
      resetReason: wasReset ? "REQUIRED_CLAIM_WINDOW_MISSED" : null
    },
    nextReward: nextReward
      ? {
          day: nextReward.day,
          type: nextReward.rewardType,
          currency: nextReward.currency,
          amount: nextReward.amount,
          title: nextReward.title,
          subtitle: nextReward.subtitle,
          assetType: nextReward.assetType
        }
      : null,
    ultimateReward: ultimateReward
      ? {
          day: ultimateReward.day,
          type: ultimateReward.rewardType,
          currency: ultimateReward.currency,
          amount: ultimateReward.amount,
          title: ultimateReward.title,
          subtitle: ultimateReward.subtitle,
          assetType: ultimateReward.assetType
        }
      : null,
    rewards: cards
  };
}

export async function claimCurrentReward(userId, options = {}) {
  const { ip = null } = options;
  const session = await mongoose.startSession();
  const now = new Date();
  let auditEvent = null;
  let auditMetadata = {};

  try {
    await AuditLog.create({
      userId,
      event: "STREAK_CLAIM_REQUEST",
      metadata: {},
      ip
    });

    let result;

    await session.withTransaction(async () => {
      const config = await getConfig(session);
      let cycle = await getOrCreateActiveCycle(userId, session);
      cycle = await maybeResetMissedCycle(userId, cycle, config, now, session);

      if (cycle.currentDay > config.totalDays) {
        cycle.status = "COMPLETED";
        await cycle.save({ session });
        auditEvent = "INVALID_CLAIM";
        auditMetadata = { reason: "CYCLE_COMPLETED", cycleId: cycle._id };
        throw new HttpError(409, "This streak cycle is complete.", "CYCLE_COMPLETED");
      }

      if (cycle.currentDay > 1 && cycle.nextClaimAt && now < cycle.nextClaimAt) {
        auditEvent = "INVALID_CLAIM";
        auditMetadata = {
          reason: "STREAK_LOCKED",
          cycleId: cycle._id,
          day: cycle.currentDay,
          nextClaimAt: cycle.nextClaimAt
        };
        throw new HttpError(
          409,
          "Your next reward is not available yet.",
          "STREAK_LOCKED",
          { nextClaimAt: cycle.nextClaimAt.toISOString() }
        );
      }

      const reward = await StreakReward.findOne({
        day: cycle.currentDay,
        active: true
      }).session(session);

      if (!reward) {
        auditEvent = "INVALID_CLAIM";
        auditMetadata = { reason: "REWARD_CONFIG_ERROR", day: cycle.currentDay };
        throw new HttpError(
          500,
          "Reward configuration is unavailable.",
          "REWARD_CONFIG_ERROR"
        );
      }

      const existing = await StreakClaim.findOne({
        userId,
        cycleId: cycle._id,
        day: cycle.currentDay,
        status: "SUCCESS"
      }).session(session);

      if (existing) {
        auditEvent = "DUPLICATE_CLAIM";
        auditMetadata = { cycleId: cycle._id, day: cycle.currentDay };
        throw new HttpError(
          409,
          "This reward has already been claimed.",
          "ALREADY_CLAIMED"
        );
      }

      if (cycle.currentDay > 1) {
        const previousClaim = await StreakClaim.findOne({
          userId,
          cycleId: cycle._id,
          day: cycle.currentDay - 1,
          status: "SUCCESS"
        }).session(session);

        if (!previousClaim) {
          auditEvent = "INVALID_CLAIM";
          auditMetadata = {
            reason: "PREVIOUS_DAY_MISSED",
            cycleId: cycle._id,
            day: cycle.currentDay
          };
          throw new HttpError(
            409,
            "Your streak has been reset. Start again from Day 1.",
            "PREVIOUS_DAY_MISSED"
          );
        }
      }

      const wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) {
        throw new HttpError(500, "Wallet is unavailable.", "WALLET_ERROR");
      }

      const balanceBefore =
        reward.rewardType === "VES"
          ? wallet.vesBalance
          : wallet.amazonGiftCardBalanceInr;
      const balanceAfter = balanceBefore + reward.amount;

      if (reward.rewardType === "VES") {
        wallet.vesBalance = balanceAfter;
      } else {
        wallet.amazonGiftCardBalanceInr = balanceAfter;
      }

      await wallet.save({ session });

      const transactionId = makeReference("STREAK");
      const tx = await WalletTransaction.create(
        [
          {
            transactionId,
            userId,
            currency: reward.currency,
            type: "CREDIT",
            amount: reward.amount,
            source: "DAILY_STREAK",
            referenceId: transactionId,
            streakDay: reward.day,
            balanceBefore,
            balanceAfter,
            status: "SUCCESS"
          }
        ],
        { session }
      );

      const claimId = makeReference("CLAIM");
      await StreakClaim.create(
        [
          {
            claimId,
            userId,
            cycleId: cycle._id,
            day: reward.day,
            rewardId: reward._id,
            status: "SUCCESS",
            claimedAt: now,
            transactionId: tx[0]._id
          }
        ],
        { session }
      );

      cycle.lastClaimAt = now;
      cycle.currentStreak += 1;

      if (reward.day >= config.totalDays) {
        cycle.currentDay = config.totalDays + 1;
        cycle.status = "COMPLETED";
        cycle.nextClaimAt = null;
        cycle.windowExpiresAt = null;
      } else {
        cycle.currentDay = reward.day + 1;
        cycle.nextClaimAt = new Date(
          now.getTime() + config.claimIntervalHours * 60 * 60 * 1000
        );
        cycle.windowExpiresAt = new Date(
          cycle.nextClaimAt.getTime() +
            config.claimWindowHours * 60 * 60 * 1000
        );
      }

      await cycle.save({ session });

      await AuditLog.create(
        [
          {
            userId,
            event: "STREAK_CLAIM_SUCCESS",
            metadata: {
              cycleId: cycle._id,
              day: reward.day,
              claimId,
              transactionId
            },
            ip
          }
        ],
        { session }
      );

      result = {
        success: true,
        claimId,
        transactionId,
        reward: {
          day: reward.day,
          type: reward.rewardType,
          currency: reward.currency,
          amount: reward.amount
        }
      };
    });

    return result;
  } catch (error) {
    if (error?.code === 11000) {
      auditEvent = "DUPLICATE_CLAIM";
      auditMetadata = { reason: "UNIQUE_CONSTRAINT" };
      throw new HttpError(
        409,
        "This reward has already been claimed.",
        "ALREADY_CLAIMED"
      );
    }
    throw error;
  } finally {
    await session.endSession();

    if (auditEvent) {
      try {
        await AuditLog.create({
          userId,
          event: auditEvent,
          metadata: auditMetadata,
          ip
        });
      } catch (auditError) {
        console.error("Failed to write claim rejection audit log:", auditError);
      }
    }
  }
}

export async function getHistory(userId) {
  return StreakClaim.find({ userId })
    .populate("rewardId", "day rewardType currency amount title subtitle")
    .populate("transactionId")
    .sort({ claimedAt: -1 })
    .lean();
}

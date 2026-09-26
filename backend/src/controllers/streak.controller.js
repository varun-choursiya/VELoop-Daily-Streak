import { claimCurrentReward, getHistory, getStreakStatus } from "../services/streak.service.js";

export async function getStreakController(req, res, next) {
  try {
    const data = await getStreakStatus(req.user._id);
    res.json({
      ...data,
      user: {
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getStatusController(req, res, next) {
  try {
    const data = await getStreakStatus(req.user._id);
    res.json({
      ...data,
      user: {
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function claimController(req, res, next) {
  try {
    const data = await claimCurrentReward(req.user._id, {
      ip: req.ip
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function historyController(req, res, next) {
  try {
    const history = await getHistory(req.user._id);
    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
}

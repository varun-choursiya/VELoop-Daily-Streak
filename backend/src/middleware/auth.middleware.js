import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Please log in to continue."
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (!payload.sub || !mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(401).json({
        success: false,
        code: "AUTH_INVALID",
        message: "Invalid authentication credentials."
      });
    }

    const user = await User.findById(payload.sub).select("_id name email");

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Account not found or session expired."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "AUTH_EXPIRED",
        message: "Session expired. Please log in again."
      });
    }

    return res.status(401).json({
      success: false,
      code: "AUTH_INVALID",
      message: "Please log in to continue."
    });
  }
}


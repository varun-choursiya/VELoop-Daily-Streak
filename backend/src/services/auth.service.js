import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { HttpError } from "../utils/httpError.js";

// Pre-calculated bcrypt hash with cost 12 for constant-time comparison when user not found
const DUMMY_HASH = "$2a$12$e80yqX3y7.G6w0D1y2Z4u.s0f0e0d0c0b0a090807060504030201";

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new HttpError(500, "JWT secret configuration is missing.", "CONFIG_ERROR");
  }
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    throw new HttpError(409, "An account with this email already exists.", "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash
  });

  await Wallet.create({ userId: user._id });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    token: signToken(user)
  };
}

export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Compare against dummy hash if user doesn't exist to eliminate side-channel timing difference
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    token: signToken(user)
  };
}


import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { HttpError } from "../utils/httpError.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
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

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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

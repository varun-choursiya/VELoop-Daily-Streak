import { validationResult } from "express-validator";
import { login, register } from "../services/auth.service.js";
import { HttpError } from "../utils/httpError.js";

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(400, "Please provide valid account details.", "VALIDATION_ERROR", errors.array());
  }
}

export async function registerController(req, res, next) {
  try {
    validate(req);
    const data = await register(req.body);
    res.status(201).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    validate(req);
    const data = await login(req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export function meController(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
}

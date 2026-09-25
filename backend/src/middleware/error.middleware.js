export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      code: "DUPLICATE",
      message: "This operation has already been processed."
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    code: err.code || "SERVER_ERROR",
    message:
      status >= 500
        ? "Unable to process your request. Please try again."
        : err.message
  });
}

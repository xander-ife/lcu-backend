// Standard JSON response helpers — used by every controller.
const ok = (res, data = {}, message = "Operation successful", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Request failed", status = 400, data = null) =>
  res.status(status).json({ success: false, message, data });

// Wrap async controllers so thrown errors reach the error middleware.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ok, fail, asyncHandler };

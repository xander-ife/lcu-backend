const { ZodError } = require("zod");

const notFound = (req, res, _next) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error("❌", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: { issues: err.issues },
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${err.meta?.target?.join?.(", ") || "unique field"}`,
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

module.exports = { notFound, errorHandler };

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const lecturerRoutes = require("./routes/lecturer.routes");
const roomRoutes = require("./routes/room.routes");
const departmentRoutes = require("./routes/department.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const userRoutes = require("./routes/user.routes");

const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

// ── Security middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiter — 200 requests / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter limiter for auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// ── Health check ────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ success: true, message: "LCU Timetable API is running" })
);
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "ok", data: { uptime: process.uptime() } })
);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/pdf", require("./routes/pdf"));

// ── 404 + error handler ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ LCU Backend running on http://localhost:${PORT}`);
});

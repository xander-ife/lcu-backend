const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { ok, asyncHandler } = require("../utils/response");

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const {
    loginId, name, email, password, role,
    departmentId, staffId, matricNumber, level, maxHours,
  } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ loginId }, { email }] },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: "loginId or email already in use" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      loginId, name, email, password: hashed, role,
      lecturer:
        role === "LECTURER" && departmentId && staffId
          ? { create: { staffId, departmentId, maxHours: maxHours ?? 12 } }
          : undefined,
      student:
        role === "STUDENT" && departmentId && matricNumber && level
          ? { create: { matricNumber, departmentId, level } }
          : undefined,
    },
    include: { lecturer: true, student: true },
  });

  const token = signToken({ id: user.id, role: user.role });
  const { password: _, ...safe } = user;
  return ok(res, { user: safe, token }, "Registered successfully", 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { loginId, password, role } = req.body;

  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { lecturer: true, student: true },
  });
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  if (role && user.role !== role) {
    return res.status(401).json({ success: false, message: "Wrong role for this account" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const token = signToken({ id: user.id, role: user.role });
  const { password: _, ...safe } = user;
  return ok(res, { user: safe, token }, "Login successful");
});

// GET /api/auth/me   (protected)
exports.me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { lecturer: { include: { department: true } }, student: { include: { department: true } } },
  });
  const { password: _, ...safe } = user;
  return ok(res, { user: safe });
});

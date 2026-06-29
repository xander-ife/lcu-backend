const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

exports.list = asyncHandler(async (_req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  return ok(res, { rooms });
});

exports.get = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: Number(req.params.id) } });
  if (!room) return res.status(404).json({ success: false, message: "Room not found" });
  return ok(res, { room });
});

exports.create = asyncHandler(async (req, res) => {
  const room = await prisma.room.create({ data: req.body });
  return ok(res, { room }, "Room created", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const room = await prisma.room.update({ where: { id: Number(req.params.id) }, data: req.body });
  return ok(res, { room }, "Room updated");
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.room.delete({ where: { id: Number(req.params.id) } });
  return ok(res, {}, "Room deleted");
});

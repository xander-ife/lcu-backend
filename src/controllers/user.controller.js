const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

exports.list = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, loginId: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, { users });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  return ok(res, {}, "User deleted");
});

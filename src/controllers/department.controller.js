const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

exports.list = asyncHandler(async (_req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return ok(res, { departments });
});

exports.create = asyncHandler(async (req, res) => {
  const department = await prisma.department.create({ data: req.body });
  return ok(res, { department }, "Department created", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const department = await prisma.department.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  return ok(res, { department }, "Department updated");
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.department.delete({ where: { id: Number(req.params.id) } });
  return ok(res, {}, "Department deleted");
});

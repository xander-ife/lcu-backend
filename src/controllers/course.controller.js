const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

exports.list = asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: { department: true, lecturers: { include: { lecturer: { include: { user: true } } } } },
    orderBy: { code: "asc" },
  });
  return ok(res, { courses });
});

exports.get = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const course = await prisma.course.findUnique({
    where: { id },
    include: { department: true, lecturers: { include: { lecturer: true } } },
  });
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  return ok(res, { course });
});

exports.create = asyncHandler(async (req, res) => {
  const course = await prisma.course.create({ data: req.body });
  return ok(res, { course }, "Course created", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const course = await prisma.course.update({ where: { id }, data: req.body });
  return ok(res, { course }, "Course updated");
});

exports.remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.course.delete({ where: { id } });
  return ok(res, {}, "Course deleted");
});

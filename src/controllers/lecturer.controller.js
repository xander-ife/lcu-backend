const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

exports.list = asyncHandler(async (_req, res) => {
  const lecturers = await prisma.lecturer.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, loginId: true, role: true } },
      department: true,
      courses: { include: { course: true } },
    },
    orderBy: { staffId: "asc" },
  });
  return ok(res, { lecturers });
});

exports.get = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const lecturer = await prisma.lecturer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, loginId: true } },
      department: true,
      courses: { include: { course: true } },
    },
  });
  if (!lecturer) return res.status(404).json({ success: false, message: "Lecturer not found" });
  return ok(res, { lecturer });
});

// PUT /api/lecturers/:id/courses   { courseIds: [1,2,3] }
exports.assignCourses = asyncHandler(async (req, res) => {
  const lecturerId = Number(req.params.id);
  const { courseIds } = req.body;

  await prisma.lecturerCourse.deleteMany({ where: { lecturerId } });
  if (courseIds.length) {
    await prisma.lecturerCourse.createMany({
      data: courseIds.map((courseId) => ({ lecturerId, courseId })),
      skipDuplicates: true,
    });
  }
  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    include: { courses: { include: { course: true } } },
  });
  return ok(res, { lecturer }, "Courses assigned");
});

exports.remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const lec = await prisma.lecturer.findUnique({ where: { id } });
  if (!lec) return res.status(404).json({ success: false, message: "Lecturer not found" });
  // delete cascade via user
  await prisma.user.delete({ where: { id: lec.userId } });
  return ok(res, {}, "Lecturer deleted");
});

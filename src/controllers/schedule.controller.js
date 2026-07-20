const prisma = require("../config/prisma");
const { ok, asyncHandler } = require("../utils/response");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOT_COUNT = 10; // matches frontend TIME_SLOTS

// GET /api/schedules  — optional filters: ?department=...&level=...&lecturerId=...
exports.list = asyncHandler(async (req, res) => {
  const { lecturerId, department, level, studentId } = req.query;
  const where = {};
  if (lecturerId) where.lecturerId = Number(lecturerId);
  if (department || level) {
    where.course = {};
    if (department) where.course.department = { name: String(department) };
    if (level) where.course.level = Number(level);
  }

  let schedules = await prisma.schedule.findMany({
    where,
    include: {
      course: { include: { department: true } },
      lecturer: { include: { user: { select: { name: true } } } },
      room: true,
    },
    orderBy: [{ day: "asc" }, { timeSlot: "asc" }],
  });

  // If studentId is given, narrow to that student's department+level
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: { department: true },
    });
    if (student) {
      schedules = schedules.filter(
        (s) =>
          s.course.level === student.level &&
          s.course.departmentId === student.departmentId
      );
    }
  }

  return ok(res, { schedules });
});

// POST /api/schedules/generate  — runs the same algorithm as the frontend mock
exports.generate = asyncHandler(async (_req, res) => {
  const [courses, lecturers, rooms] = await Promise.all([
    prisma.course.findMany({
      include: { lecturers: true, department: true },
      orderBy: { population: "desc" },
    }),
    prisma.lecturer.findMany({ include: { courses: true } }),
    prisma.room.findMany({ orderBy: { capacity: "asc" } }),
  ]);

  // clear existing schedules for current session/semester
  await prisma.schedule.deleteMany({});

  const usedSlots = {};   // roomId|day|slot
  const lecturerSlots = {}; // lecturerId|day|slot
  const cohortSlots = {};   // deptId|level|day|slot

  const findRoom = (pop) => rooms.find((r) => r.capacity >= pop) || rooms[rooms.length - 1];
  const findLecturer = (courseId) =>
    lecturers.find((l) => l.courses.some((c) => c.courseId === courseId));

  const created = [];

  for (let courseIdx = 0; courseIdx < courses.length; courseIdx++) {
  const course = courses[courseIdx];
  const room = findRoom(course.population);
  const lecturer = findLecturer(course.id);
  let placed = false;

  // Rotate starting day for each course to spread across all 5 days
  const startDay = courseIdx % DAYS.length;
  const rotatedDays = [...DAYS.slice(startDay), ...DAYS.slice(0, startDay)];

  for (const day of rotatedDays) {
    if (placed) break;
      for (let slot = 0; slot < TIME_SLOT_COUNT - 1; slot++) {
        const sKey = `${room.id}|${day}|${slot}`;
        const lKey = lecturer ? `${lecturer.id}|${day}|${slot}` : null;
        const cKey = `${course.departmentId}|${course.level}|${day}|${slot}`;
        if (usedSlots[sKey] || (lKey && lecturerSlots[lKey]) || cohortSlots[cKey]) continue;

        const schedule = await prisma.schedule.create({
          data: {
            courseId: course.id,
            lecturerId: lecturer ? lecturer.id : null,
            roomId: room.id,
            day,
            timeSlot: slot,
            duration: 2,
          },
        });
        usedSlots[sKey] = true;
        if (lKey) lecturerSlots[lKey] = true;
        cohortSlots[cKey] = true;
        created.push(schedule);
        placed = true;
        break;
      }
    }
  }

  return ok(res, { count: created.length, schedules: created }, "Timetable generated", 201);
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.schedule.delete({ where: { id: Number(req.params.id) } });
  return ok(res, {}, "Schedule deleted");
});

exports.clearAll = asyncHandler(async (_req, res) => {
  const { count } = await prisma.schedule.deleteMany({});
  return ok(res, { count }, "Timetable cleared");
});

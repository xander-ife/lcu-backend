const { z } = require("zod");

const registerSchema = z.object({
  loginId: z.string().min(3).max(50),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
  // optional profile fields
  departmentId: z.number().int().positive().optional(),
  staffId: z.string().optional(),
  matricNumber: z.string().optional(),
  level: z.number().int().optional(),
  maxHours: z.number().int().optional(),
});

const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]).optional(),
});

const courseSchema = z.object({
  code: z.string().min(3).max(20),
  title: z.string().min(3).max(200),
  units: z.number().int().min(1).max(10).default(3),
  level: z.number().int().min(100).max(900),
  semester: z.number().int().min(1).max(2),
  population: z.number().int().min(0).default(0),
  contactHours: z.number().int().min(1).default(3),
  departmentId: z.number().int().positive(),
});

const roomSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().positive(),
  type: z.string().min(1),
  projector: z.boolean().default(false),
  smartBoard: z.boolean().default(false),
  ac: z.boolean().default(false),
  lab: z.boolean().default(false),
});

const departmentSchema = z.object({
  name: z.string().min(2).max(100),
  color: z.string().optional(),
});

const lecturerCoursesSchema = z.object({
  courseIds: z.array(z.number().int().positive()),
});

module.exports = {
  registerSchema,
  loginSchema,
  courseSchema,
  roomSchema,
  departmentSchema,
  lecturerCoursesSchema,
};

// Seeds the DB with the same mock data your frontend uses, plus 3 demo accounts.
// Run with: npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  console.log("🌱 Seeding…");

  // 1) Departments
  const deptData = [
    { name: "Software Engineering", color: "#1A3A8F" },
    { name: "Computer Science", color: "#2563EB" },
    { name: "Engineering", color: "#059669" },
    { name: "Business Administration", color: "#D97706" },
    { name: "Law", color: "#7C3AED" },
    { name: "Medicine", color: "#DC2626" },
    { name: "Education", color: "#0891B2" },
  ];
  for (const d of deptData) {
    await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d });
  }
  const depts = await prisma.department.findMany();
  const deptByName = Object.fromEntries(depts.map((d) => [d.name, d]));

  // 2) Courses
  const courses = [
    ["SEN401","Software Project Management",400,2,90,"Software Engineering"],
    ["SEN402","Advanced Software Engineering",400,2,88,"Software Engineering"],
    ["SEN403","Mobile Application Development",400,2,85,"Software Engineering"],
    ["SEN404","Cloud Computing & DevOps",400,2,80,"Software Engineering"],
    ["CSC301","Data Structures & Algorithms",300,2,120,"Computer Science"],
    ["CSC302","Database Management Systems",300,2,115,"Computer Science"],
    ["ENG301","Circuit Theory",300,2,100,"Engineering"],
    ["BUS301","Financial Management",300,2,130,"Business Administration"],
  ];
  for (const [code, title, level, semester, population, deptName] of courses) {
    await prisma.course.upsert({
      where: { code },
      update: {},
      create: {
        code, title, units: 3, level, semester, population, contactHours: 3,
        departmentId: deptByName[deptName].id,
      },
    });
  }

  // 3) Rooms
  const rooms = [
    { name: "LT-101", capacity: 200, type: "Lecture Theatre", projector: true, smartBoard: true, ac: true, lab: false },
    { name: "LT-102", capacity: 150, type: "Lecture Theatre", projector: true, smartBoard: false, ac: true, lab: false },
    { name: "CR-201", capacity: 80,  type: "Classroom", projector: true, smartBoard: false, ac: false, lab: false },
    { name: "CR-202", capacity: 60,  type: "Classroom", projector: false, smartBoard: false, ac: false, lab: false },
    { name: "LAB-301", capacity: 50, type: "Computer Lab", projector: true, smartBoard: true, ac: true, lab: true },
    { name: "CR-301", capacity: 120, type: "Classroom", projector: true, smartBoard: false, ac: true, lab: false },
  ];
  for (const r of rooms) {
    await prisma.room.upsert({ where: { name: r.name }, update: {}, create: r });
  }

  // 4) Demo users (one per role) — password: "password123"
  const pw = await bcrypt.hash("password123", 10);

  // Admin
  await prisma.user.upsert({
    where: { loginId: "admin" },
    update: {},
    create: {
      loginId: "admin", name: "System Admin", email: "admin@lcu.edu.ng",
      password: pw, role: "ADMIN",
    },
  });

  // Lecturer
  await prisma.user.upsert({
    where: { loginId: "LCU/SE/001" },
    update: {},
    create: {
      loginId: "LCU/SE/001", name: "Dr. Adebayo Okafor", email: "a.okafor@lcu.edu.ng",
      password: pw, role: "LECTURER",
      lecturer: {
        create: {
          staffId: "LCU/SE/001",
          departmentId: deptByName["Software Engineering"].id,
          maxHours: 12,
        },
      },
    },
  });

  // Student
  await prisma.user.upsert({
    where: { loginId: "LCU/SE/2021/001" },
    update: {},
    create: {
      loginId: "LCU/SE/2021/001", name: "Jane Student", email: "jane@lcu.edu.ng",
      password: pw, role: "STUDENT",
      student: {
        create: {
          matricNumber: "LCU/SE/2021/001",
          departmentId: deptByName["Software Engineering"].id,
          level: 400,
        },
      },
    },
  });

  console.log("✅ Seed complete. Demo logins (password: password123):");
  console.log("   admin / admin");
  console.log("   lecturer / LCU/SE/001");
  console.log("   student / LCU/SE/2021/001");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

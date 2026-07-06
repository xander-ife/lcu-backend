const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");

const prisma = new PrismaClient();

// GET /api/pdf/timetable?userId=xxx&role=student
router.get("/timetable", protect, async (req, res) => {
  try {
    const user = req.user;

    // Fetch timetable slots based on role
    let slots = [];

    if (user.role === "student") {
      slots = await prisma.timetableSlot.findMany({
        where: {
          course: {
            department: { name: user.department },
            level: user.level,
          },
        },
        include: {
          course: true,
          lecturer: true,
          room: true,
        },
        orderBy: [{ day: "asc" }, { timeSlot: "asc" }],
      });
    } else if (user.role === "lecturer") {
      slots = await prisma.timetableSlot.findMany({
        where: { lecturerId: user.id },
        include: {
          course: true,
          lecturer: true,
          room: true,
        },
        orderBy: [{ day: "asc" }, { timeSlot: "asc" }],
      });
    } else {
      // admin gets everything
      slots = await prisma.timetableSlot.findMany({
        include: {
          course: true,
          lecturer: true,
          room: true,
        },
        orderBy: [{ day: "asc" }, { timeSlot: "asc" }],
      });
    }

    const TIME_LABELS = [
      "8:00 AM","9:00 AM","10:00 AM","11:00 AM",
      "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
    ];

    // Build the PDF
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

    // Tell the browser this is a PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="LCU-Timetable-${user.name.replace(/ /g, "-")}.pdf"`
    );

    // Pipe PDF directly to response
    doc.pipe(res);

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 60).fill("#0A1F5C");
    doc.fillColor("#FFFFFF")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Lead City University, Ibadan", 40, 15, { align: "center" });
    doc.fontSize(10)
      .font("Helvetica")
      .text("Automated Timetable & Course Allocation System", 40, 36, { align: "center" });
    doc.fontSize(9)
      .text("Knowledge for Self Reliance", 40, 49, { align: "center" });

    // ── STUDENT/LECTURER INFO ────────────────────────────────────────────────
    doc.moveDown(4);
    doc.fillColor("#0A1F5C")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Name: ${user.name}`, 40, 75);
    doc.fillColor("#5A6A8A")
      .fontSize(10)
      .font("Helvetica")
      .text(`Role: ${user.role} | Session: 2025/2026 | Semester: 2`, 40, 92);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      40, 106
    );

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    doc.moveTo(40, 122).lineTo(doc.page.width - 40, 122).strokeColor("#D0D8E8").stroke();

    // ── TABLE HEADER ─────────────────────────────────────────────────────────
    const tableTop = 132;
    const colWidths = [80, 70, 180, 120, 70, 80];
    const colHeaders = ["Day", "Time", "Course", "Lecturer", "Room", "Level"];
    const rowHeight = 24;
    let currentY = tableTop;

    // Header row background
    doc.rect(40, currentY, doc.page.width - 80, rowHeight).fill("#0A1F5C");

    let xPos = 40;
    colHeaders.forEach((header, i) => {
      doc.fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(header, xPos + 4, currentY + 7, { width: colWidths[i], lineBreak: false });
      xPos += colWidths[i];
    });

    currentY += rowHeight;

    // ── TABLE ROWS ────────────────────────────────────────────────────────────
    slots.forEach((slot, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(40, currentY, doc.page.width - 80, rowHeight).fill("#F0F4FB");
      } else {
        doc.rect(40, currentY, doc.page.width - 80, rowHeight).fill("#FFFFFF");
      }

      xPos = 40;
      const rowData = [
        slot.day || "-",
        TIME_LABELS[slot.timeSlot] || "-",
        `${slot.course?.code} - ${slot.course?.title?.slice(0, 28)}`,
        slot.lecturer?.name?.split(" ").slice(0, 3).join(" ") || "-",
        slot.room?.name || "-",
        `${slot.course?.level || "-"}`,
      ];

      rowData.forEach((cell, i) => {
        doc.fillColor("#1A1A2E")
          .fontSize(8)
          .font("Helvetica")
          .text(cell, xPos + 4, currentY + 7, { width: colWidths[i] - 4, lineBreak: false });
        xPos += colWidths[i];
      });

      // Row border
      doc.moveTo(40, currentY + rowHeight)
        .lineTo(doc.page.width - 40, currentY + rowHeight)
        .strokeColor("#E8EDF5")
        .stroke();

      currentY += rowHeight;

      // Add new page if running out of space
      if (currentY > doc.page.height - 60) {
        doc.addPage();
        currentY = 40;
      }
    });

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.fillColor("#8898B0")
      .fontSize(8)
      .text(
        "© 2025 Lead City University, Ibadan | portal.lcu.edu.ng | This document is computer-generated",
        40,
        doc.page.height - 30,
        { align: "center" }
      );

    doc.end();

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
});

module.exports = router;
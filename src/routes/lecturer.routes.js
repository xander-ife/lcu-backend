const router = require("express").Router();
const c = require("../controllers/lecturer.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { lecturerCoursesSchema } = require("../validators/schemas");

router.get("/", protect, c.list);
router.get("/:id", protect, c.get);
router.put("/:id/courses", protect, authorize("ADMIN"), validate(lecturerCoursesSchema), c.assignCourses);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

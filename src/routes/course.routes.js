const router = require("express").Router();
const c = require("../controllers/course.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { courseSchema } = require("../validators/schemas");

router.get("/", protect, c.list);
router.get("/:id", protect, c.get);
router.post("/", protect, authorize("ADMIN"), validate(courseSchema), c.create);
router.put("/:id", protect, authorize("ADMIN"), validate(courseSchema.partial()), c.update);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

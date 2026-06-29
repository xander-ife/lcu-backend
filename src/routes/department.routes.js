const router = require("express").Router();
const c = require("../controllers/department.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { departmentSchema } = require("../validators/schemas");

router.get("/", protect, c.list);
router.post("/", protect, authorize("ADMIN"), validate(departmentSchema), c.create);
router.put("/:id", protect, authorize("ADMIN"), validate(departmentSchema.partial()), c.update);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

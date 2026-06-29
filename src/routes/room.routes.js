const router = require("express").Router();
const c = require("../controllers/room.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { roomSchema } = require("../validators/schemas");

router.get("/", protect, c.list);
router.get("/:id", protect, c.get);
router.post("/", protect, authorize("ADMIN"), validate(roomSchema), c.create);
router.put("/:id", protect, authorize("ADMIN"), validate(roomSchema.partial()), c.update);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

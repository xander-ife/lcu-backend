const router = require("express").Router();
const c = require("../controllers/schedule.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.get("/", protect, c.list);
router.post("/generate", protect, authorize("ADMIN"), c.generate);
router.delete("/all", protect, authorize("ADMIN"), c.clearAll);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

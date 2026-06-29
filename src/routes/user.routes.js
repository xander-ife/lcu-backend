const router = require("express").Router();
const c = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.get("/", protect, authorize("ADMIN"), c.list);
router.delete("/:id", protect, authorize("ADMIN"), c.remove);

module.exports = router;

const router = require("express").Router();
const c = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/schemas");

router.post("/register", validate(registerSchema), c.register);
router.post("/login", validate(loginSchema), c.login);
router.get("/me", protect, c.me);

module.exports = router;

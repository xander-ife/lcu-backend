const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/prisma");

// Verifies JWT, attaches { id, role, loginId } to req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, loginId: true, name: true, email: true },
    });
    if (!user)
      return res.status(401).json({ success: false, message: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Role-based access — usage: authorize("ADMIN") or authorize("ADMIN","LECTURER")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: "Forbidden — insufficient role" });
  next();
};

module.exports = { protect, authorize };

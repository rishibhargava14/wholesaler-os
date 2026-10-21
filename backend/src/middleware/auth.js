const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "wholesaler_os_super_secret_jwt_key_2026"
      );

      req.company = await Company.findById(decoded.id || decoded.companyId).select(
        "-passwordHash"
      );

      if (!req.company) {
        return res.status(401).json({ message: "Company not found for this token" });
      }

      req.companyId = req.company._id;
      return next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "wholesaler_os_super_secret_jwt_key_2026"
      );
      req.company = await Company.findById(decoded.id || decoded.companyId).select(
        "-passwordHash"
      );
      if (req.company) {
        req.companyId = req.company._id;
      }
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }

  if (!req.companyId && (req.query?.companyId || req.body?.companyId)) {
    req.companyId = req.query?.companyId || req.body?.companyId;
  }

  next();
};

module.exports = { protect, optionalAuth };

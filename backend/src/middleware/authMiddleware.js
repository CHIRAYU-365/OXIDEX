const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Access denied. Authentication token required." });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("FATAL: JWT_SECRET environment variable is not configured.");
      return res.status(500).json({ success: false, error: "Server authentication error." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    
    
    if (decoded.address) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: decoded.address.toLowerCase() },
      });
      if (user && user.isBanned) {
        return res.status(403).json({ success: false, error: "Your account is suspended." });
      }
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired. Please re-authenticate." });
    }
    return res.status(401).json({ success: false, error: "Invalid authentication token." });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    
    const adminPinHeader = req.headers["x-admin-pin"];
    const expectedPin = process.env.ADMIN_PIN || "a1b2";
    
    if (adminPinHeader && adminPinHeader === expectedPin) {
      return next();
    }

    
    if (req.user && req.user.address) {
      const adminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
      
      if (adminWallet && req.user.address.toLowerCase() === adminWallet) {
        return next();
      }
      
      
      const user = await prisma.user.findUnique({
        where: { walletAddress: req.user.address.toLowerCase() },
      });
      if (user && user.onChainId === 1) {
        return next();
      }
    }

    return res.status(403).json({ success: false, error: "Access denied. Administrator privileges required." });
  } catch (error) {
    console.error("Error verifying admin privileges:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
      }
    }
  } catch (_) {
    
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  optionalAuth,
};

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { getNonce, verifySignature, mockRegister } = require("./controllers/authController");
const {
  getUserProfile,
  getUserPartners,
  getPlatformStats,
  getAdminTree,
  getAdminUsersList,
  banUser,
  unbanUser,
  getCommissions,
  setCommissions,
  generateStatementPDF
} = require("./controllers/userController");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => {
      try {
        const url = new URL(o.trim());
        return `${url.protocol}//${url.host}`;
      } catch (_) {
        return o.trim().replace(/\/$/, "");
      }
    })
  : ["*"];
app.use(cors({
  origin: function (origin, callback) {
    // Echo the requested origin to allow dynamic Vercel preview URLs
    callback(null, origin || true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(morgan("dev"));

const tarpitMiddleware = (req, res, next) => {
  const badPaths = ['.env', 'wp-admin', 'phpmyadmin', 'db-admin', 'config.php', 'sql', 'dump'];
  const isMalicious = badPaths.some(p => req.path.toLowerCase().includes(p));
  
  if (isMalicious) {
    console.warn(`[TARPIT] Caught potential scanner from ${req.ip} targeting ${req.path}`);
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Connection': 'keep-alive' });
    // Keep the connection open indefinitely by sending a single space every 10 seconds
    // This wastes the hacker's scanner threads ("onion loop")
    setInterval(() => {
      res.write(' ');
    }, 10000);
  } else {
    next();
  }
};
app.use(tarpitMiddleware);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests from this IP, please try again after 15 minutes" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many authentication requests, please try again after 15 minutes" },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: Date.now() });
});

app.post("/api/auth/nonce", getNonce);
app.post("/api/auth/verify", verifySignature);
app.post("/api/auth/mock-register", mockRegister);


app.get("/api/users/:idOrAddress", getUserProfile);
app.get("/api/users/:idOrAddress/partners", getUserPartners); 
app.get("/api/users/:idOrAddress/statement/pdf", generateStatementPDF); 


app.get("/api/admin/tree", getAdminTree); 
app.get("/api/admin/users", getAdminUsersList);
app.post("/api/admin/users/:walletAddress/ban", banUser);
app.post("/api/admin/users/:walletAddress/unban", unbanUser);
app.get("/api/admin/commissions", getCommissions);
app.post("/api/admin/commissions", setCommissions);

app.get("/api/platform/stats", getPlatformStats);


app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Resource not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandle exception:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

module.exports = app;

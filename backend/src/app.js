const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { getNonce, verifySignature, mockRegister } = require("./controllers/authController");
const {
  getUserProfile,
  getUserPartners,
  getMatrixState,
  getPlatformStats,
  getUserHistory,
} = require("./controllers/userController");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

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
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(morgan("dev"));

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
app.get("/api/users/:idOrAddress/history", getUserHistory);
app.get("/api/matrix/:userAddress/:program/:level", getMatrixState);
app.get("/api/platform/stats", getPlatformStats);

app.use("/api/analytics", analyticsRoutes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Resource not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandle exception:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

module.exports = app;

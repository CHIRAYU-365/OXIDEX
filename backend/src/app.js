const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const platformRoutes = require("./routes/platformRoutes");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, origin || true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(morgan("dev"));

const tarpitMiddleware = (req, res, next) => {
  const badPaths = [".env", "wp-admin", "phpmyadmin", "db-admin", "config.php", "sql", "dump"];
  const isMalicious = badPaths.some((p) => req.path.toLowerCase().includes(p));

  if (isMalicious) {
    console.warn(`[TARPIT] Caught potential scanner from ${req.ip} targeting ${req.path}`);
    res.writeHead(200, { "Content-Type": "text/plain", Connection: "keep-alive" });
    setInterval(() => {
      res.write(" ");
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
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests from this IP, please try again after 15 minutes." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many authentication attempts, please try again after 15 minutes." },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/platform", platformRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

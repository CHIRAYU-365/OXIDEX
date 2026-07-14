require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { startIndexer } = require("./services/indexer");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["*"];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("subscribe:personal", (address) => {
    if (address && address.startsWith("0x")) {
      const lowercaseAddress = address.toLowerCase();
      socket.join(`room:${lowercaseAddress}`);
    }
  });

  socket.on("unsubscribe:personal", (address) => {
    if (address && address.startsWith("0x")) {
      const lowercaseAddress = address.toLowerCase();
      socket.leave(`room:${lowercaseAddress}`);
    }
  });
});

startIndexer(io);

server.listen(PORT, () => {
  console.log(`[Server] OxideX API running on port ${PORT}`);
});

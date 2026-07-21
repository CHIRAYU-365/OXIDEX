const express = require("express");
const router = express.Router();
const {
  getPlatformStats,
  getLeaderboard,
  getIndexerStatus,
} = require("../controllers/platformController");

router.get("/stats", getPlatformStats);
router.get("/leaderboard", getLeaderboard);
router.get("/indexer-status", getIndexerStatus);

module.exports = router;

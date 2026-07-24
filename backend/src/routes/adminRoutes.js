const express = require("express");
const router = express.Router();
const {
  getAdminTree,
  getAdminUsersList,
  banUser,
  unbanUser,
  getCommissions,
  setCommissions,
  getAdminAnalytics,
} = require("../controllers/adminController");
const { optionalAuth, verifyAdmin } = require("../middleware/authMiddleware");

router.use(optionalAuth);
router.use(verifyAdmin);

router.get("/tree", getAdminTree);
router.get("/users", getAdminUsersList);
router.post("/users/:walletAddress/ban", banUser);
router.post("/users/:walletAddress/unban", unbanUser);
router.get("/commissions", getCommissions);
router.post("/commissions", setCommissions);
router.get("/analytics", getAdminAnalytics);

module.exports = router;

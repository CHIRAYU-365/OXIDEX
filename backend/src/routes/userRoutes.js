const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUserPartners,
  getUserHistory,
  generateStatementPDF,
  getUserByRefCode,
  setRefCode,
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/ref/:refCode", getUserByRefCode);
router.post("/ref", verifyToken, setRefCode);

router.get("/:idOrAddress", getUserProfile);
router.get("/:idOrAddress/partners", getUserPartners);
router.get("/:idOrAddress/history", getUserHistory);
router.get("/:idOrAddress/statement/pdf", generateStatementPDF);

module.exports = router;

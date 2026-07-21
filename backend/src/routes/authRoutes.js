const express = require("express");
const router = express.Router();
const { getNonce, verifySignature, getMe, mockRegister } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/nonce", getNonce);
router.post("/verify", verifySignature);
router.get("/me", verifyToken, getMe);
router.post("/mock-register", mockRegister);

module.exports = router;

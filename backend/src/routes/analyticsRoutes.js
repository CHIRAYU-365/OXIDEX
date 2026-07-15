const express = require("express");
const { getTopEarners, getTopRecruiters } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/top-earners", getTopEarners);
router.get("/top-recruiters", getTopRecruiters);

module.exports = router;

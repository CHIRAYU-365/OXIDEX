const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get Top 10 Earners globally
const getTopEarners = async (req, res) => {
  try {
    const topEarners = await prisma.user.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: 10,
      select: {
        onChainId: true,
        walletAddress: true,
        totalEarnings: true,
        partnersCount: true
      }
    });
    res.json({ success: true, data: topEarners });
  } catch (err) {
    console.error("Error fetching top earners:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Top 10 Recruiters globally
const getTopRecruiters = async (req, res) => {
  try {
    const topRecruiters = await prisma.user.findMany({
      orderBy: { partnersCount: 'desc' },
      take: 10,
      select: {
        onChainId: true,
        walletAddress: true,
        partnersCount: true,
        totalEarnings: true
      }
    });
    res.json({ success: true, data: topRecruiters });
  } catch (err) {
    console.error("Error fetching top recruiters:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getTopEarners,
  getTopRecruiters
};

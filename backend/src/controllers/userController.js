const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserProfile = async (req, res) => {
  try {
    const { idOrAddress } = req.params;
    let query = {};

    if (idOrAddress.startsWith("0x")) {
      query = { walletAddress: idOrAddress.toLowerCase() };
    } else {
      const id = parseInt(idOrAddress, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid user ID or wallet address" });
      }
      query = { onChainId: id };
    }

    const user = await prisma.user.findUnique({ where: query });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not registered in local cache DB" });
    }

    const activeLevels = await prisma.matrixState.findMany({
      where: { userAddress: user.walletAddress, isActive: true },
      select: { program: true, level: true },
    });

    const activeLevelsX3 = activeLevels.filter(m => m.program === "x3").map(m => m.level);
    const activeLevelsX4 = activeLevels.filter(m => m.program === "x4").map(m => m.level);
    const activeLevelsX2 = activeLevels.filter(m => m.program === "x2").map(m => m.level);

    const earnings = await prisma.earning.findMany({
      where: { userAddress: user.walletAddress },
      select: { amount: true },
    });

    const totalEarnings = earnings.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        onChainId: user.onChainId,
        referrerAddress: user.referrerAddress,
        partnersCount: user.partnersCount,
        registeredAt: user.registeredAt,
        activeLevelsX3,
        activeLevelsX4,
        activeLevelsX2,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getUserPartners = async (req, res) => {
  try {
    const { idOrAddress } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    let query = {};
    if (idOrAddress.startsWith("0x")) {
      query = { walletAddress: idOrAddress.toLowerCase() };
    } else {
      const id = parseInt(idOrAddress, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid user ID or wallet address" });
      }
      query = { onChainId: id };
    }

    const user = await prisma.user.findUnique({ where: query });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const partners = await prisma.user.findMany({
      where: { referrerAddress: user.walletAddress },
      skip,
      take: limit,
      orderBy: { registeredAt: "desc" },
    });

    const total = await prisma.user.count({
      where: { referrerAddress: user.walletAddress },
    });

    return res.json({
      success: true,
      data: partners,
      meta: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching user partners:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMatrixState = async (req, res) => {
  try {
    const { userAddress, program, level } = req.params;
    const lvl = parseInt(level, 10);

    if (!userAddress.startsWith("0x") || (program !== "x3" && program !== "x4" && program !== "x2") || isNaN(lvl)) {
      return res.status(400).json({ success: false, error: "Invalid query parameters" });
    }

    const state = await prisma.matrixState.findUnique({
      where: {
        userAddress_program_level: {
          userAddress: userAddress.toLowerCase(),
          program,
          level: lvl,
        },
      },
    });

    if (!state) {
      return res.json({
        success: true,
        data: {
          userAddress: userAddress.toLowerCase(),
          program,
          level: lvl,
          isActive: false,
          reinvestCount: 0,
          currentReferrer: null,
          referrals: [],
          firstLevel: [],
          secondLevel: [],
        },
      });
    }

    return res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Error fetching matrix state:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const earningsSum = await prisma.earning.aggregate({
      _sum: { amount: true },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users24h = await prisma.user.count({
      where: { registeredAt: { gte: oneDayAgo } },
    });
    
    const volume24hSum = await prisma.earning.aggregate({
      where: { earnedAt: { gte: oneDayAgo } },
      _sum: { amount: true },
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalVolume: earningsSum._sum.amount || 0,
        volume24h: volume24hSum._sum.amount || 0,
        users24h,
      },
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const { idOrAddress } = req.params;
    let walletAddress = idOrAddress.toLowerCase();

    if (!idOrAddress.startsWith("0x")) {
      const id = parseInt(idOrAddress, 10);
      const user = await prisma.user.findUnique({ where: { onChainId: id } });
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      walletAddress = user.walletAddress;
    }

    const earnings = await prisma.earning.findMany({
      where: { userAddress: walletAddress },
      orderBy: { earnedAt: "desc" },
      take: 50,
    });

    const transactions = await prisma.transaction.findMany({
      where: { userAddress: walletAddress },
      orderBy: { blockTimestamp: "desc" },
      take: 50,
    });

    const history = [
      ...earnings.map(e => ({ ...e, recordType: "earning", date: e.earnedAt })),
      ...transactions.map(t => ({ ...t, recordType: "transaction", date: t.blockTimestamp }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching user history:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  getUserPartners,
  getMatrixState,
  getPlatformStats,
  getUserHistory,
};

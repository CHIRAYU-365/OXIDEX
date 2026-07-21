const prisma = require("../utils/prisma");

const getAdminTree = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        onChainId: true,
        walletAddress: true,
        referrerAddress: true,
        partnersCount: true,
        totalEarnings: true,
        registeredAt: true,
        isBanned: true,
      },
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching admin tree:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAdminUsersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";

    const where = search
      ? {
          OR: [
            { walletAddress: { contains: search } },
            { referrerAddress: { contains: search } },
            ...(isNaN(parseInt(search, 10)) ? [] : [{ onChainId: parseInt(search, 10) }]),
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy: { registeredAt: "desc" },
      select: {
        id: true,
        onChainId: true,
        walletAddress: true,
        referrerAddress: true,
        partnersCount: true,
        totalEarnings: true,
        oxiTokenBalance: true,
        registeredAt: true,
        lastSeenAt: true,
        isBanned: true,
      },
    });

    const total = await prisma.user.count({ where });

    return res.json({
      success: true,
      data: users,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error("Error fetching admin users list:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const banUser = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: { isBanned: true },
    });
    return res.json({ success: true, message: "User banned successfully" });
  } catch (error) {
    console.error("Error banning user:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: { isBanned: false },
    });
    return res.json({ success: true, message: "User access restored" });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getCommissions = async (req, res) => {
  try {
    const configs = await prisma.adminConfig.findMany({
      orderBy: { level: "asc" },
    });
    return res.json({ success: true, data: configs });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const setCommissions = async (req, res) => {
  try {
    const { levels } = req.body;
    if (!Array.isArray(levels)) {
      return res.status(400).json({ success: false, error: "Invalid payload format" });
    }

    const updates = levels.map((l) =>
      prisma.adminConfig.upsert({
        where: { level: l.level },
        update: { commissionBps: l.commissionBps },
        create: { level: l.level, commissionBps: l.commissionBps },
      })
    );
    await prisma.$transaction(updates);

    return res.json({ success: true, message: "Commissions updated successfully" });
  } catch (error) {
    console.error("Error setting commissions:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const bannedUsers = await prisma.user.count({ where: { isBanned: true } });

    const totalEarningsSum = await prisma.earning.aggregate({
      _sum: { amount: true },
    });

    const totalTransactionsCount = await prisma.transaction.count();

    const topEarners = await prisma.user.findMany({
      take: 10,
      orderBy: { totalEarnings: "desc" },
      select: {
        onChainId: true,
        walletAddress: true,
        totalEarnings: true,
        partnersCount: true,
      },
    });

    const recentSignups = await prisma.user.findMany({
      take: 5,
      orderBy: { registeredAt: "desc" },
      select: {
        onChainId: true,
        walletAddress: true,
        registeredAt: true,
      },
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        bannedUsers,
        totalVolume: totalEarningsSum._sum.amount || 0,
        totalTransactions: totalTransactionsCount,
        topEarners,
        recentSignups,
      },
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getAdminTree,
  getAdminUsersList,
  banUser,
  unbanUser,
  getCommissions,
  setCommissions,
  getAdminAnalytics,
};

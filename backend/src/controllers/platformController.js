const prisma = require("../utils/prisma");

const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const earningsSum = await prisma.earning.aggregate({ _sum: { amount: true } });

    
    let stats = await prisma.platformStats.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const totalVolume = earningsSum._sum.amount ? parseFloat(earningsSum._sum.amount) : 0;

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalVolume,
        volume24h: stats ? parseFloat(stats.volume24h) : 0,
        users24h: stats ? stats.users24h : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const type = req.query.type || "earnings"; 
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const orderBy = type === "partners" ? { partnersCount: "desc" } : { totalEarnings: "desc" };

    const topUsers = await prisma.user.findMany({
      take: limit,
      where: { isBanned: false },
      orderBy,
      select: {
        onChainId: true,
        walletAddress: true,
        partnersCount: true,
        totalEarnings: true,
        oxiTokenBalance: true,
        registeredAt: true,
      },
    });

    return res.json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getIndexerStatus = async (req, res) => {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS || "Not configured";
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    
    const lastTx = await prisma.transaction.findFirst({
      orderBy: { blockTimestamp: "desc" },
      select: { blockNumber: true, blockTimestamp: true, txHash: true },
    });

    return res.json({
      success: true,
      data: {
        status: "active",
        contractAddress,
        rpcUrlConfigured: Boolean(process.env.RPC_URL),
        latestIndexedBlock: lastTx ? lastTx.blockNumber : null,
        latestIndexedTx: lastTx ? lastTx.txHash : null,
        latestSyncTime: lastTx ? lastTx.blockTimestamp : null,
      },
    });
  } catch (error) {
    console.error("Error fetching indexer status:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getPlatformStats,
  getLeaderboard,
  getIndexerStatus,
};

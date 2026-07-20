const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PDFDocument = require("pdfkit");

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

    return res.json({
      success: true,
      data: user,
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
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error("Error fetching user partners:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAdminTree = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        walletAddress: true,
        referrerAddress: true,
        partnersCount: true,
        totalEarnings: true,
        registeredAt: true,
      }
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching admin tree:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAdminUsersList = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 20,
      orderBy: { registeredAt: 'desc' },
      select: {
        id: true,
        onChainId: true,
        walletAddress: true,
        referrerAddress: true,
        partnersCount: true,
        totalEarnings: true,
        registeredAt: true,
        isBanned: true,
      }
    });
    return res.json({ success: true, data: users });
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
      data: { isBanned: true }
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
      data: { isBanned: false }
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
      orderBy: { level: 'asc' }
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

    const updates = levels.map(l => 
      prisma.adminConfig.upsert({
        where: { level: l.level },
        update: { commissionBps: l.commissionBps },
        create: { level: l.level, commissionBps: l.commissionBps }
      })
    );
    await prisma.$transaction(updates);

    return res.json({ success: true, message: "Commissions updated" });
  } catch (error) {
    console.error("Error setting commissions:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const generateStatementPDF = async (req, res) => {
  try {
    const { idOrAddress } = req.params;
    let walletAddress = idOrAddress.toLowerCase();
    if (!idOrAddress.startsWith("0x")) {
      const user = await prisma.user.findUnique({ where: { onChainId: parseInt(idOrAddress, 10) } });
      if (user) walletAddress = user.walletAddress;
    }

    const earnings = await prisma.earning.findMany({
      where: { userAddress: walletAddress },
      orderBy: { earnedAt: "desc" },
    });
    
    const transactions = await prisma.transaction.findMany({
      where: { userAddress: walletAddress },
      orderBy: { blockTimestamp: "desc" },
    });

    const doc = new PDFDocument();
    res.setHeader('Content-disposition', `attachment; filename=Statement_${walletAddress}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text(`Transaction Statement`, { align: 'center' });
    doc.fontSize(12).text(`User: ${walletAddress}`, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text('Earnings');
    if (earnings.length === 0) doc.fontSize(10).text("No earnings found.");
    earnings.forEach(e => {
      doc.fontSize(10).text(`- ${e.earnedAt.toISOString()}: +${e.amount} from ${e.fromAddress} (Level ${e.level})`);
    });
    
    doc.moveDown();
    doc.fontSize(14).text('Transactions');
    if (transactions.length === 0) doc.fontSize(10).text("No transactions found.");
    transactions.forEach(t => {
      doc.fontSize(10).text(`- ${t.blockTimestamp.toISOString()}: ${t.eventType} ${t.amount || t.tokensAmount || ''} Tx: ${t.txHash}`);
    });

    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const earningsSum = await prisma.earning.aggregate({ _sum: { amount: true } });
    return res.json({
      success: true,
      data: {
        totalUsers,
        totalVolume: earningsSum._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  getUserPartners,
  getPlatformStats,
  getAdminTree,
  getAdminUsersList,
  banUser,
  unbanUser,
  getCommissions,
  setCommissions,
  generateStatementPDF
};

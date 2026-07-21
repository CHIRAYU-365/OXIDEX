const prisma = require("../utils/prisma");
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

const getUserHistory = async (req, res) => {
  try {
    const { idOrAddress } = req.params;
    let walletAddress = idOrAddress.toLowerCase();

    if (!idOrAddress.startsWith("0x")) {
      const user = await prisma.user.findUnique({ where: { onChainId: parseInt(idOrAddress, 10) } });
      if (user) walletAddress = user.walletAddress;
      else return res.status(404).json({ success: false, error: "User not found" });
    }

    const earnings = await prisma.earning.findMany({
      where: { userAddress: walletAddress },
      orderBy: { earnedAt: "desc" },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userAddress: walletAddress },
      orderBy: { blockTimestamp: "desc" },
    });

    const history = [
      ...earnings.map((e) => ({
        date: e.earnedAt,
        recordType: "earning",
        amount: e.amount,
        fromAddress: e.fromAddress,
        level: e.level,
        txHash: e.txHash,
      })),
      ...transactions.map((t) => ({
        date: t.blockTimestamp,
        recordType: "transaction",
        amount: t.amount,
        tokensAmount: t.tokensAmount,
        eventType: t.eventType,
        txHash: t.txHash,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching user history:", error);
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
    res.setHeader("Content-disposition", `attachment; filename=Statement_${walletAddress}.pdf`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`OXIDEX Protocol - Transaction Statement`, { align: "center" });
    doc.fontSize(12).text(`User Wallet: ${walletAddress}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text("Earning Records (P2P Commissions)");
    if (earnings.length === 0) doc.fontSize(10).text("No earnings recorded.");
    earnings.forEach((e) => {
      doc.fontSize(10).text(`- ${e.earnedAt.toISOString()}: +${e.amount} ETH from ${e.fromAddress} (Level ${e.level})`);
    });

    doc.moveDown();
    doc.fontSize(14).text("On-Chain Transactions");
    if (transactions.length === 0) doc.fontSize(10).text("No transactions recorded.");
    transactions.forEach((t) => {
      doc.fontSize(10).text(
        `- ${t.blockTimestamp.toISOString()}: ${t.eventType} | Amount: ${t.amount || t.tokensAmount || "0"} | Tx: ${t.txHash}`
      );
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF statement:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
};

const getUserByRefCode = async (req, res) => {
  try {
    const { refCode } = req.params;
    const user = await prisma.user.findUnique({
      where: { refCode },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: "Referral code not found" });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error resolving ref code:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const setRefCode = async (req, res) => {
  try {
    const { refCode } = req.body;
    if (!req.user || !req.user.address) {
      return res.status(401).json({ success: false, error: "Unauthenticated" });
    }
    if (!refCode || typeof refCode !== "string" || refCode.trim().length < 3) {
      return res.status(400).json({ success: false, error: "Referral code must be at least 3 characters long" });
    }

    const cleanCode = refCode.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { refCode: cleanCode } });
    if (existing && existing.walletAddress !== req.user.address.toLowerCase()) {
      return res.status(400).json({ success: false, error: "Referral code is already taken" });
    }

    const updatedUser = await prisma.user.update({
      where: { walletAddress: req.user.address.toLowerCase() },
      data: { refCode: cleanCode },
    });

    return res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error setting ref code:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  getUserPartners,
  getUserHistory,
  generateStatementPDF,
  getUserByRefCode,
  setRefCode,
};

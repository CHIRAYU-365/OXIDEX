const { generateNonce, SiweMessage } = require("siwe");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const NONCE_TTL_MS = 5 * 60 * 1000;
class NonceStore {
  constructor() {
    this.store = new Map();
  }
  set(key, nonce) {
    if (this.store.has(key)) {
      clearTimeout(this.store.get(key).timer);
    }
    const timer = setTimeout(() => this.store.delete(key), NONCE_TTL_MS);
    this.store.set(key, { nonce, timer });
  }
  get(key) {
    const entry = this.store.get(key);
    return entry ? entry.nonce : undefined;
  }
  delete(key) {
    const entry = this.store.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.store.delete(key);
    }
  }
}
const nonces = new NonceStore();

const getNonce = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, error: "Address is required" });
    }

    const nonce = generateNonce();
    nonces.set(address.toLowerCase(), nonce);

    return res.json({ success: true, data: { nonce } });
  } catch (error) {
    console.error("Error generating nonce:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const verifySignature = async (req, res) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const lowercaseAddress = address.toLowerCase();
    const storedNonce = nonces.get(lowercaseAddress);

    if (!storedNonce) {
      return res.status(400).json({ success: false, error: "Expired or invalid nonce challenge" });
    }

    const siweMessage = new SiweMessage(message);
    const verification = await siweMessage.verify({
      signature,
      nonce: storedNonce,
    });

    if (!verification.success) {
      return res.status(400).json({ success: false, error: "Signature verification failed" });
    }

    if (siweMessage.address.toLowerCase() !== lowercaseAddress) {
      return res.status(400).json({ success: false, error: "Authenticated address mismatch" });
    }

    nonces.delete(lowercaseAddress);

    let user = await prisma.user.findUnique({
      where: { walletAddress: lowercaseAddress },
    });

    if (user && user.isBanned) {
      return res.status(403).json({ success: false, error: "Account suspended" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("FATAL: JWT_SECRET environment variable is not set.");
      return res.status(500).json({ success: false, error: "Server configuration error" });
    }

    const token = jwt.sign(
      { address: lowercaseAddress, userId: user ? user.id : null },
      jwtSecret,
      { expiresIn: "24h" }
    );

    if (user) {
      await prisma.user.update({
        where: { walletAddress: lowercaseAddress },
        data: { lastSeenAt: new Date() },
      });
    }

    return res.json({
      success: true,
      data: {
        token,
        user: user || { walletAddress: lowercaseAddress, registered: false },
      },
    });
  } catch (error) {
    console.error("Error verifying signature:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const mockRegister = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, error: "Mock registration is disabled in production" });
  }
  try {
    const { address, referrerAddress } = req.body;
    if (!address || !referrerAddress) {
      return res.status(400).json({ success: false, error: "Missing address or referrer" });
    }

    const lowercaseAddress = address.toLowerCase();

    let user = await prisma.user.findUnique({ where: { walletAddress: lowercaseAddress } });
    if (user) {
      return res.status(400).json({ success: false, error: "User already registered" });
    }

    const maxUser = await prisma.user.findFirst({ orderBy: { onChainId: "desc" } });
    const newOnChainId = maxUser ? maxUser.onChainId + 1 : 1;

    user = await prisma.user.create({
      data: {
        walletAddress: lowercaseAddress,
        onChainId: newOnChainId,
        referrerAddress: referrerAddress.toLowerCase(),
      }
    });



    return res.json({ success: true, message: "Mock registration successful" });
  } catch (error) {
    console.error("Mock register error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getNonce,
  verifySignature,
  mockRegister,
};

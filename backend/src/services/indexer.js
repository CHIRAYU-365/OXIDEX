const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");
const { sendTelegramAlert } = require("./telegramBot");
const prisma = new PrismaClient();


const OXIDEX_ABI = [
  "event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId)",
  "event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount)",
  "event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent)"
];

let isIndexRunning = false;

class Mutex {
  constructor() {
    this._queue = [];
    this._locked = false;
  }
  async lock() {
    return new Promise(resolve => {
      this._queue.push(resolve);
      this._dispatch();
    });
  }
  unlock() {
    this._locked = false;
    this._dispatch();
  }
  _dispatch() {
    if (this._locked || this._queue.length === 0) return;
    this._locked = true;
    const resolve = this._queue.shift();
    resolve();
  }
}

class KeyedMutex {
  constructor() {
    this.mutexes = new Map();
  }
  async runExclusive(key, run) {
    if (!this.mutexes.has(key)) {
      this.mutexes.set(key, new Mutex());
    }
    const mutex = this.mutexes.get(key);
    await mutex.lock();
    try {
      return await run();
    } finally {
      mutex.unlock();
      if (mutex._queue.length === 0) {
        this.mutexes.delete(key);
      }
    }
  }
}

const dbMutex = new KeyedMutex();

const startIndexer = (io) => {
  if (isIndexRunning) return;
  isIndexRunning = true;

  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("INDEXER ERROR: CONTRACT_ADDRESS is not defined in env.");
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    batchMaxCount: 1
  });
  const contract = new ethers.Contract(contractAddress, OXIDEX_ABI, provider);

  const handleRegistration = async (user, referrer, userId, referrerId, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.log.transactionHash;
        const userLower = user.toLowerCase();
        const referrerLower = referrer.toLowerCase();

        await prisma.$transaction(async (tx) => {
          await tx.user.upsert({
            where: { walletAddress: userLower },
            update: { onChainId: Number(userId), referrerAddress: referrerLower },
            create: {
              walletAddress: userLower,
              onChainId: Number(userId),
              referrerAddress: referrerLower,
            },
          });

          if (referrerLower !== ethers.ZeroAddress.toLowerCase()) {
            await tx.user.upsert({
              where: { walletAddress: referrerLower },
              update: { partnersCount: { increment: 1 } },
              create: {
                walletAddress: referrerLower,
                onChainId: Number(referrerId),
                partnersCount: 1,
              },
            });
          }

          await tx.transaction.create({
            data: {
              txHash,
              userAddress: userLower,
              eventType: "Registration",
              blockNumber: event.log.blockNumber,
              blockTimestamp: new Date(),
            },
          });
        });

        io.emit("ws:event", {
          type: "registration",
          data: {
            userId: Number(userId),
            referrerId: Number(referrerId),
            walletAddress: userLower,
            txHash,
            timestamp: Date.now(),
          },
        });

        
        if (typeof sendTelegramAlert === "function") {
          sendTelegramAlert(`🎉 <b>New Member Registered!</b>\nUser: <code>${userLower}</code>\nReferred by: <code>${referrerLower}</code>`);
        }
      } catch (err) {
        console.error("Error processing Registration event:", err);
      }
    });
  };

  const handleCommissionPaid = async (from, to, level, amount, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.log.transactionHash;
        const fromLower = from.toLowerCase();
        const toLower = to.toLowerCase();
        const val = ethers.formatEther(amount);
        const lvl = Number(level);
        
        const ethVal = amount.toString();

        await prisma.$transaction(async (tx) => {
          await tx.earning.create({
            data: {
              userAddress: toLower,
              level: lvl,
              amount: ethVal,
              fromAddress: fromLower,
              txHash,
            },
          });

          await tx.notification.create({
            data: {
              userAddress: toLower,
              type: "earning",
              title: "New Commission Received!",
              body: `You received ${val} ETH from partner in Level ${lvl}.`,
            },
          });

          await tx.user.updateMany({
            where: { walletAddress: toLower },
            data: { totalEarnings: { increment: ethVal } }
          });
        });

        io.emit(`ws:earning:${toLower}`, {
          level: lvl,
          amount: ethVal,
          fromAddress: fromLower,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Error processing CommissionPaid event:", err);
      }
    });
  };

  const handleTokensPurchased = async (buyer, tokenAmount, ethSpent, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.log.transactionHash;
        const buyerLower = buyer.toLowerCase();
        const tokensInEther = ethers.formatEther(tokenAmount);

        await prisma.$transaction(async (tx) => {
          await tx.transaction.create({
            data: {
              txHash,
              userAddress: buyerLower,
              eventType: "TokensPurchased",
              amount: ethSpent.toString(),
              tokensAmount: tokenAmount.toString(),
              blockNumber: event.log.blockNumber,
              blockTimestamp: new Date(),
            },
          });

          // Update user's OXI token balance in DB
          await tx.user.updateMany({
            where: { walletAddress: buyerLower },
            data: { oxiTokenBalance: { increment: tokensInEther } }
          });
        });

        io.emit("ws:event", {
          type: "tokensPurchased",
          data: {
            buyer: buyerLower,
            tokens: tokenAmount.toString(),
            eth: ethSpent.toString(),
            txHash,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error("Error processing TokensPurchased event:", err);
      }
    });
  };

  contract.on("Registration", handleRegistration);
  contract.on("CommissionPaid", handleCommissionPaid);
  contract.on("TokensPurchased", handleTokensPurchased);
};

module.exports = {
  startIndexer,
};

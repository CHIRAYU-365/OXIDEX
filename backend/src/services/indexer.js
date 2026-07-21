const { ethers } = require("ethers");
const prisma = require("../utils/prisma");
const { sendTelegramAlert } = require("./telegramBot");

const OXIDEX_ABI = [
  "event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId)",
  "event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount)",
  "event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent)",
];

let isIndexRunning = false;

class Mutex {
  constructor() {
    this._queue = [];
    this._locked = false;
  }
  async lock() {
    return new Promise((resolve) => {
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

const PUBLIC_SEPOLIA_RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.ankr.com/eth_sepolia",
  "https://1rpc.io/sepolia",
  "https://rpc2.sepolia.org",
];

const startIndexer = (io) => {
  if (isIndexRunning) return;
  isIndexRunning = true;

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("INDEXER ERROR: CONTRACT_ADDRESS is not defined in env.");
    return;
  }

  const configuredRpc = process.env.RPC_URL;
  const rpcList = configuredRpc ? [configuredRpc, ...PUBLIC_SEPOLIA_RPCS] : PUBLIC_SEPOLIA_RPCS;

  let activeRpcIndex = 0;
  let lastProcessedBlock = null;

  const getActiveProvider = () => {
    const rpc = rpcList[activeRpcIndex % rpcList.length];
    return new ethers.JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });
  };

  const handleRegistration = async (user, referrer, userId, referrerId, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.transactionHash;
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

          await tx.transaction.upsert({
            where: { txHash },
            update: {},
            create: {
              txHash,
              userAddress: userLower,
              eventType: "Registration",
              blockNumber: event.blockNumber,
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
          sendTelegramAlert(
            `🎉 <b>New Member Registered!</b>\nUser: <code>${userLower}</code>\nReferred by: <code>${referrerLower}</code>`
          );
        }
      } catch (err) {
        console.error("Error processing Registration event:", err.message || err);
      }
    });
  };

  const handleCommissionPaid = async (from, to, level, amount, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.transactionHash;
        const fromLower = from.toLowerCase();
        const toLower = to.toLowerCase();
        const val = ethers.formatEther(amount);
        const lvl = Number(level);
        const ethVal = amount.toString();

        await prisma.$transaction(async (tx) => {
          
          const existing = await prisma.earning.findFirst({
            where: { txHash, userAddress: toLower, level: lvl },
          });

          if (!existing) {
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
              data: { totalEarnings: { increment: ethVal } },
            });
          }
        });

        io.emit(`ws:earning:${toLower}`, {
          level: lvl,
          amount: ethVal,
          fromAddress: fromLower,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Error processing CommissionPaid event:", err.message || err);
      }
    });
  };

  const handleTokensPurchased = async (buyer, tokenAmount, ethSpent, event) => {
    await dbMutex.runExclusive("db", async () => {
      try {
        const txHash = event.transactionHash;
        const buyerLower = buyer.toLowerCase();
        const tokensInEther = ethers.formatEther(tokenAmount);

        await prisma.$transaction(async (tx) => {
          await tx.transaction.upsert({
            where: { txHash },
            update: {},
            create: {
              txHash,
              userAddress: buyerLower,
              eventType: "TokensPurchased",
              amount: ethSpent.toString(),
              tokensAmount: tokenAmount.toString(),
              blockNumber: event.blockNumber,
              blockTimestamp: new Date(),
            },
          });

          await tx.user.updateMany({
            where: { walletAddress: buyerLower },
            data: { oxiTokenBalance: { increment: tokensInEther } },
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
        console.error("Error processing TokensPurchased event:", err.message || err);
      }
    });
  };

  
  const pollEvents = async () => {
    try {
      const provider = getActiveProvider();
      const contract = new ethers.Contract(contractAddress, OXIDEX_ABI, provider);

      const latestBlock = await provider.getBlockNumber();

      if (lastProcessedBlock === null) {
        
        lastProcessedBlock = Math.max(0, latestBlock - 50);
        console.log(`[Indexer Stateless Sync] Starting event indexing from block #${lastProcessedBlock}`);
      }

      if (latestBlock > lastProcessedBlock) {
        const fromBlock = lastProcessedBlock + 1;
        const toBlock = Math.min(latestBlock, fromBlock + 500); 

        
        const regEvents = await contract.queryFilter("Registration", fromBlock, toBlock);
        for (const evt of regEvents) {
          if (evt.args) {
            await handleRegistration(evt.args[0], evt.args[1], evt.args[2], evt.args[3], evt);
          }
        }

        
        const commEvents = await contract.queryFilter("CommissionPaid", fromBlock, toBlock);
        for (const evt of commEvents) {
          if (evt.args) {
            await handleCommissionPaid(evt.args[0], evt.args[1], evt.args[2], evt.args[3], evt);
          }
        }

        
        const tokenEvents = await contract.queryFilter("TokensPurchased", fromBlock, toBlock);
        for (const evt of tokenEvents) {
          if (evt.args) {
            await handleTokensPurchased(evt.args[0], evt.args[1], evt.args[2], evt);
          }
        }

        lastProcessedBlock = toBlock;
      }
    } catch (err) {
      console.warn(`[Indexer Poll Notice] RPC endpoint notice (${rpcList[activeRpcIndex % rpcList.length]}):`, err.message || err);
      activeRpcIndex++; 
    }
  };

  
  console.log(`[Indexer] Starting stateless block indexer service...`);
  pollEvents();
  setInterval(pollEvents, 12000); 
};

module.exports = {
  startIndexer,
};

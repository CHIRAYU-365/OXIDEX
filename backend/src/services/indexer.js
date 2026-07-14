const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");
const { OXIDEX_ABI } = require("../web3/abi");

const prisma = new PrismaClient();

class KeyedMutex {
  constructor() {
    this.locks = new Map();
  }

  async acquire(keys) {
    const cleanKeys = keys
      .filter(Boolean)
      .map(k => k.toLowerCase())
      .filter(k => k !== "0x0000000000000000000000000000000000000000");

    while (true) {
      const activePromises = [];
      for (const key of cleanKeys) {
        if (this.locks.has(key)) {
          activePromises.push(this.locks.get(key));
        }
      }
      if (activePromises.length === 0) {
        break;
      }
      await Promise.all(activePromises);
    }

    let resolveLock;
    const lockPromise = new Promise(resolve => {
      resolveLock = resolve;
    });

    for (const key of cleanKeys) {
      this.locks.set(key, lockPromise);
    }

    return () => {
      for (const key of cleanKeys) {
        if (this.locks.get(key) === lockPromise) {
          this.locks.delete(key);
        }
      }
      resolveLock();
    };
  }
}

const mutex = new KeyedMutex();
let isIndexRunning = false;

const startIndexer = (io) => {
  if (isIndexRunning) return;
  isIndexRunning = true;

  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const confirmations = parseInt(process.env.CONFIRMATIONS, 10) || 0;

  if (!contractAddress) {
    console.error("INDEXER ERROR: CONTRACT_ADDRESS is not defined in env.");
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, OXIDEX_ABI, provider);

  const getPrice = (level) => {
    return 0.025 * Math.pow(2, level - 1);
  };

  const handleRegistration = async (user, referrer, userId, referrerId, event) => {
    const release = await mutex.acquire([user, referrer]);
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

        await tx.matrixState.upsert({
          where: { userAddress_program_level: { userAddress: userLower, program: "x3", level: 1 } },
          update: { isActive: true },
          create: { userAddress: userLower, program: "x3", level: 1, isActive: true },
        });

        await tx.matrixState.upsert({
          where: { userAddress_program_level: { userAddress: userLower, program: "x4", level: 1 } },
          update: { isActive: true },
          create: { userAddress: userLower, program: "x4", level: 1, isActive: true },
        });

        await tx.matrixState.upsert({
          where: { userAddress_program_level: { userAddress: userLower, program: "x2", level: 1 } },
          update: { isActive: true },
          create: { userAddress: userLower, program: "x2", level: 1, isActive: true },
        });

        await tx.transaction.create({
          data: {
            txHash,
            userAddress: userLower,
            eventType: "Registration",
            program: null,
            level: 1,
            amount: 0.075,
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
    } catch (err) {
      console.error("Error processing Registration event:", err);
    } finally {
      release();
    }
  };

  const handleUpgrade = async (user, referrer, matrix, level, event) => {
    const release = await mutex.acquire([user, referrer]);
    try {
      const txHash = event.log.transactionHash;
      const prog = matrix === 1 ? "x3" : (matrix === 2 ? "x4" : "x2");
      const lvl = Number(level);

      const userLower = user.toLowerCase();

      await prisma.$transaction(async (tx) => {
        await tx.matrixState.upsert({
          where: { userAddress_program_level: { userAddress: userLower, program: prog, level: lvl } },
          update: { isActive: true },
          create: { userAddress: userLower, program: prog, level: lvl, isActive: true },
        });

        await tx.transaction.create({
          data: {
            txHash,
            userAddress: userLower,
            eventType: "Upgrade",
            program: prog,
            level: lvl,
            amount: getPrice(lvl),
            blockNumber: event.log.blockNumber,
            blockTimestamp: new Date(),
          },
        });
      });

      io.emit("ws:event", {
        type: "upgrade",
        data: {
          userAddress: userLower,
          program: prog,
          level: lvl,
          txHash,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("Error processing Upgrade event:", err);
    } finally {
      release();
    }
  };

  const handleReinvest = async (user, currentReferrer, caller, matrix, level, event) => {
    const release = await mutex.acquire([user, currentReferrer]);
    try {
      const txHash = event.log.transactionHash;
      const prog = matrix === 1 ? "x3" : (matrix === 2 ? "x4" : "x2");
      const lvl = Number(level);

      const userLower = user.toLowerCase();

      await prisma.$transaction(async (tx) => {
        await tx.matrixState.update({
          where: { userAddress_program_level: { userAddress: userLower, program: prog, level: lvl } },
          data: {
            reinvestCount: { increment: 1 },
            referrals: [],
            firstLevel: [],
            secondLevel: [],
          },
        });

        await tx.transaction.create({
          data: {
            txHash,
            userAddress: userLower,
            eventType: "Reinvest",
            program: prog,
            level: lvl,
            amount: getPrice(lvl),
            blockNumber: event.log.blockNumber,
            blockTimestamp: new Date(),
          },
        });
      });

      io.emit("ws:event", {
        type: "reinvest",
        data: {
          userAddress: userLower,
          program: prog,
          level: lvl,
          txHash,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("Error processing Reinvest event:", err);
    } finally {
      release();
    }
  };

  const handleNewUserPlace = async (user, referrer, matrix, level, place, event) => {
    const release = await mutex.acquire([user, referrer]);
    try {
      const prog = matrix === 1 ? "x3" : (matrix === 2 ? "x4" : "x2");
      const lvl = Number(level);
      const plc = Number(place);
      const userLower = user.toLowerCase();
      const referrerLower = referrer.toLowerCase();

      const state = await prisma.matrixState.findUnique({
        where: { userAddress_program_level: { userAddress: referrerLower, program: prog, level: lvl } },
      });

      if (state) {
        if (prog === "x3" || prog === "x2") {
          const refs = [...state.referrals];
          if (!refs.includes(userLower)) {
            refs.push(userLower);
            await prisma.matrixState.update({
              where: { id: state.id },
              data: { referrals: refs },
            });
          }
        } else {
          const first = [...state.firstLevel];
          const second = [...state.secondLevel];
          if (plc === 1 || plc === 2) {
            if (!first.includes(userLower)) {
              first.push(userLower);
              await prisma.matrixState.update({
                where: { id: state.id },
                data: { firstLevel: first },
              });
            }
          } else {
            if (!second.includes(userLower)) {
              second.push(userLower);
              await prisma.matrixState.update({
                where: { id: state.id },
                data: { secondLevel: second },
              });
            }
          }
        }
      }

      io.emit("ws:event", {
        type: "newUserPlace",
        data: {
          userAddress: userLower,
          referrerAddress: referrerLower,
          program: prog,
          level: lvl,
          place: plc,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("Error processing NewUserPlace event:", err);
    } finally {
      release();
    }
  };

  const handleSentExtraEthDividends = async (from, receiver, matrix, level, event) => {
    const release = await mutex.acquire([from, receiver]);
    try {
      const txHash = event.log.transactionHash;
      const prog = matrix === 1 ? "x3" : (matrix === 2 ? "x4" : "x2");
      const lvl = Number(level);
      const fromLower = from.toLowerCase();
      const receiverLower = receiver.toLowerCase();
      const val = getPrice(lvl);

      await prisma.$transaction(async (tx) => {
        await tx.earning.create({
          data: {
            userAddress: receiverLower,
            sourceType: "direct",
            program: prog,
            level: lvl,
            amount: val,
            fromAddress: fromLower,
            txHash,
          },
        });

        await tx.notification.create({
          data: {
            userAddress: receiverLower,
            type: "earning",
            title: "New Earning Received!",
            body: `You received ${val} ETH from partner in ${prog.toUpperCase()} Level ${lvl}.`,
          },
        });
      });

      io.emit(`ws:earning:${receiverLower}`, {
        program: prog,
        level: lvl,
        amount: val,
        fromAddress: fromLower,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Error processing SentExtraEthDividends event:", err);
    } finally {
      release();
    }
  };

  const handleMissedEthReceive = async (receiver, from, matrix, level, event) => {
    const release = await mutex.acquire([receiver, from]);
    try {
      const prog = matrix === 1 ? "x3" : (matrix === 2 ? "x4" : "x2");
      const lvl = Number(level);
      const receiverLower = receiver.toLowerCase();
      const fromLower = from.toLowerCase();
      const val = getPrice(lvl);

      await prisma.notification.create({
        data: {
          userAddress: receiverLower,
          type: "missed_profit",
          title: "Missed Profit Alert!",
          body: `You missed a profit of ${val} ETH in ${prog.toUpperCase()} Level ${lvl} because you haven't activated this level.`,
        },
      });

      io.emit(`ws:missed:${receiverLower}`, {
        program: prog,
        level: lvl,
        amount: val,
        fromAddress: fromLower,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Error processing MissedEthReceive event:", err);
    } finally {
      release();
    }
  };

  if (confirmations > 0) {
    let lastProcessedBlock = 0;

    const pollEvents = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        const targetBlock = currentBlock - confirmations;
        if (targetBlock <= lastProcessedBlock) return;

        if (lastProcessedBlock === 0) {
          const maxTx = await prisma.transaction.findFirst({
            orderBy: { blockNumber: "desc" },
            select: { blockNumber: true },
          });
          lastProcessedBlock = maxTx ? maxTx.blockNumber : (targetBlock - 1);
        }

        const fromBlock = lastProcessedBlock + 1;
        const toBlock = targetBlock;

        if (fromBlock > toBlock) return;

        const logs = await provider.getLogs({
          address: contractAddress,
          fromBlock,
          toBlock,
        });

        logs.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
          return a.index - b.index;
        });

        for (const log of logs) {
          const parsedLog = contract.interface.parseLog(log);
          if (!parsedLog) continue;

          const eventArgs = [...parsedLog.args];
          const eventObj = {
            log: {
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            },
          };

          if (parsedLog.name === "Registration") {
            await handleRegistration(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventObj);
          } else if (parsedLog.name === "Upgrade") {
            await handleUpgrade(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventObj);
          } else if (parsedLog.name === "Reinvest") {
            await handleReinvest(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventArgs[4], eventObj);
          } else if (parsedLog.name === "NewUserPlace") {
            await handleNewUserPlace(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventArgs[4], eventObj);
          } else if (parsedLog.name === "SentExtraEthDividends") {
            await handleSentExtraEthDividends(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventObj);
          } else if (parsedLog.name === "MissedEthReceive") {
            await handleMissedEthReceive(eventArgs[0], eventArgs[1], eventArgs[2], eventArgs[3], eventObj);
          }
        }

        lastProcessedBlock = toBlock;
      } catch (err) {
        console.error("[Indexer] Polling error:", err);
      }
    };

    pollEvents();
    setInterval(pollEvents, 15000);
  } else {
    contract.on("Registration", handleRegistration);
    contract.on("Upgrade", handleUpgrade);
    contract.on("Reinvest", handleReinvest);
    contract.on("NewUserPlace", handleNewUserPlace);
    contract.on("SentExtraEthDividends", handleSentExtraEthDividends);
    contract.on("MissedEthReceive", handleMissedEthReceive);
  }
};

module.exports = {
  startIndexer,
};

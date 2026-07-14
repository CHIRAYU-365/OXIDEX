# OXIDEX Decentralized Matrix Platform

OXIDEX is a 100% decentralized, fully autonomous smart contract matrix platform running on EVM-compatible networks. 

## Features

- **Immutable Smart Contract**: Fully verifiable on-chain logic. No admin controls, no backdoors.
- **P2P Payments**: 100% of all matrix slot buys and registrations go directly to user wallets peer-to-peer.
- **x3 & x4 Matrix Programs**: Dual dynamic structures. x3 focuses on direct sales, while x4 incorporates team spillovers and passive network mechanics.
- **SIWE Authentication**: Cryptographic "Sign In With Ethereum" ensures true Web3 native authentication without passwords.
- **Real-time Event Indexer**: A robust custom indexing service that processes real-time blockchain logs via WebSockets to instantly update UI state and send notifications without delay.

## Architecture

1. **Smart Contracts (`/blockchain`)**: Solidity contracts (Hardhat) utilizing custom recursive algorithms for upline discovery and dividend distribution.
2. **Backend Engine (`/backend`)**: Node.js + Express API wrapping Prisma ORM and PostgreSQL. Serves SIWE nonces, off-chain caching for real-time leaderboards, and handles WebSocket connections.
3. **Frontend Dashboard (`/frontend`)**: React frontend styled with TailwindCSS, interacting dynamically with both on-chain logic (ethers.js) and off-chain cached state (REST/Socket.io).

## Installation

### 1. Blockchain (Hardhat)
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node
```

### 2. Backend API
```bash
cd backend
npm install
# Set up .env with DATABASE_URL, JWT_SECRET, CONTRACT_ADDRESS
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend App
```bash
cd frontend
npm install
# Set up .env with VITE_CONTRACT_ADDRESS
npm run dev
```

## Security Posture

- Prevented infinite recursion in upline search by bounding the depth.
- Mitigated flash loan / contract-based exploits by validating `tx.origin`.
- Fully strict linted and comments stripped for production deployment.
- JWT nonce-based session validation properly handled to avoid replay and memory leak attacks.
- Robust concurrent event processing with custom Mutex patterns in the indexing engine to prevent matrix state corruption on race conditions.

## License

MIT License. See `LICENSE` for details.

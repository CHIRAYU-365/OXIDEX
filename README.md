<div align="center">

# ⚡ OXIDEX PROTOCOL ⚡
**The Decentralized Unilevel Token Launchpad**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Ethereum](https://img.shields.io/badge/Network-Ethereum_Sepolia-627EEA.svg?logo=ethereum)](https://sepolia.etherscan.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v18.0.0-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg?logo=react)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636.svg?logo=solidity)](https://soliditylang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)

<br>

<p align="center">
  <em>An unstoppable blockchain unilevel marketing protocol designed for hyper-scalability, peer-to-peer instantaneous payments, and autonomous token launchpad presales.</em>
</p>

---

</div>

<br>

## 🌌 Protocol Infographic & High-Level Architecture

The OXIDEX ecosystem is built upon a tri-layer architecture consisting of a **Web3 Frontend**, a **Real-time Backend Node**, and the **EVM Smart Contracts**.

```mermaid
graph TD
    %% Styling
    classDef user fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff
    classDef frontend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef backend fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    classDef blockchain fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef db fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff

    %% Nodes
    U((Web3 User)):::user
    F[React / Vite Frontend\nEthers.js]:::frontend
    B[Node.js Express Backend\nSocket.io / Ethers]:::backend
    DB[(Neon PostgreSQL\nPrisma ORM)]:::db
    SC[(OxideXBase Contract\nERC20 OXI Token)]:::blockchain

    %% Edges
    U -- "Connect Wallet" --> F
    F -- "Sign Message (EIP-712)" --> B
    B -- "Validate Signature" --> SC
    B -- "Issue JWT" --> F
    F -- "Buy Presale Tokens (Tx)" --> SC
    SC -- "Emit Events" --> B
    B -- "Sync State" --> DB
    B -- "WebSockets Push" --> F
    F -- "Read Global State" --> DB
    SC -- "Peer-to-Peer Commission" --> U
```

<br>

## 📊 The 5-Level Unilevel System

OXIDEX deploys a single, linear progression network where users earn commissions up to 5 levels deep from their direct and indirect referrals.

```mermaid
graph TD
    classDef root fill:#0ea5e9,color:#fff,stroke:#0284c7;
    classDef p1 fill:#10b981,color:#fff,stroke:#047857;

    Root((You)):::root
    Root --- L1((Level 1\n10% Payout)):::p1
    L1 --- L2((Level 2\n5% Payout)):::p1
    L2 --- L3((Level 3\n3% Payout)):::p1
    L3 --- L4((Level 4\n2% Payout)):::p1
    L4 --- L5((Level 5\n1% Payout)):::p1
```

> **Mechanics:** When a user buys tokens from the launchpad, a portion of the ETH is instantly routed up the referral tree, rewarding the sponsor network directly to their wallets.

<br>

## 🔐 Core Features & Security Implementations

| Feature | Implementation Details | Security Standard |
|----------------|------------------------|-------------------|
| **P2P Commissions** | Payments never touch a central treasury. | Fully Decentralized |
| **Token Presale** | Instantly mint $OXI tokens when purchasing via the Launchpad. | Non-custodial |
| **Token Rewards** | Users get ERC20 ($OXI) when they register and recruit. | OpenZeppelin ERC20 |
| **JWT Off-Chain** | Signatures verify wallet ownership before granting dashboard access. | EIP-712 / Ethers |
| **WebSockets** | Live network feed without constantly querying the blockchain RPC. | Socket.io / EventLog |

<br>

## 🛠 Project Monorepo Structure

The project is broken into three distinct workspaces. Follow the `README.md` files inside each respective directory for hyper-detailed instructions.

```text
OXIDEX/
├── blockchain/         # Hardhat, Solidity 0.8.20+, OpenZeppelin
│   ├── contracts/      # OxideXBase.sol, OxiToken.sol
│   ├── scripts/        # deploy.js (Linking logic)
│   └── test/           # Chai / Mocha unit tests
│
├── backend/            # Node.js, Express, Prisma ORM, Socket.io
│   ├── prisma/         # schema.prisma (Neon Postgres)
│   ├── src/
│   │   ├── services/   # indexer.js (Blockchain listener)
│   │   ├── controllers/# authController.js, userController.js
│   │   └── app.js      # Main Express API entry
│   └── seed_owner.js   # Master Account injection script
│
└── frontend/           # React 18, Vite, Tailwind CSS, Lucide Icons
    ├── src/
    │   ├── context/    # Web3Context.jsx (Ethers.js provider)
    │   ├── pages/      # TokenLaunchpad, Dashboard
    │   └── components/ # Layouts, Real-time feeds
    └── index.html      # Vite Entry point
```

<br>

## 🚀 Deployment (Render + Vercel)

This project is optimized exclusively for production environments without the need for local blockchain configurations.

- **Backend (Render)**: Set your root directory to `backend/` in Render dashboard. Render will automatically install dependencies and run `npm start` (which handles Prisma generation and runs the Express server).
- **Frontend (Vercel)**: Import the repository to Vercel, set the Framework Preset to Vite, and set the Root Directory to `frontend`. Vercel will automatically run `npm run build` and deploy the application.

<br>

## ⚡ Step-by-Step Installation

### Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [MetaMask Wallet](https://metamask.io/) installed in your browser
- A PostgreSQL Database (e.g. [Neon](https://neon.tech/))
- Sepolia Testnet ETH

### 1. Blockchain Deployment
```bash
cd blockchain
npm install
# Add your ALCHEMY_URL and PRIVATE_KEY to .env
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```
*Copy the deployed contract addresses. You will need them for the frontend and backend.*

### 2. Backend Initialization
```bash
cd backend
npm install
# Add DATABASE_URL, CORS_ORIGIN, JWT_SECRET, PRIVATE_KEY to .env
npx prisma generate
npx prisma db push
node seed_owner.js
npm run dev
```

### 3. Frontend Execution
```bash
cd frontend
npm install
# Add VITE_BACKEND_URL and update CONTRACT_ADDRESS in utils/contract.js
npm run dev
```

<br>

## 💸 Economic Data Flow Diagram

Understanding the flow of Ether through the system is critical.

```mermaid
sequenceDiagram
    participant Bob as Bob (User)
    participant SC as Smart Contract
    participant Alice as Alice (Upline)
    participant DB as Backend Database
    
    Bob->>SC: buyLaunchpadTokens(referrer) + 1.0 ETH
    SC->>SC: calculateUpline(Bob)
    
    SC->>Alice: transfer(10% ETH Commission)
    SC-->>Alice: Emit CommissionPaid
    
    SC->>Bob: Mint 10000 OXI
    SC-->>Bob: Emit TokensPurchased

    SC-->>DB: Indexer catches Event
    DB->>DB: Prisma Update (earnings, tokens)
    DB-->>Bob: Socket.io Emit ("Live Feed Update")
```

<br>

## 🛡 Security Audits & Known Vectors

- **Reentrancy**: Mitigated using OpenZeppelin `ReentrancyGuard` on all state-mutating, value-transferring functions.
- **Gas Limits**: Reinvestment loops are strictly capped at mathematical limits, heavily tested to prevent Out-Of-Gas (OOG) reverts.
- **Admin Keys**: The owner account is initialized at deploy time, and the commission percentages can be modified.
- **Token Emissions**: $OXI Token minting is strictly regulated by the `OxideXBase` contract acting as the sole authorized minter.

<br>

<div align="center">
  <b>Built with ❤️ for the decentralized future.</b><br>
  For questions, please refer to the specific workspace READMEs.
</div>

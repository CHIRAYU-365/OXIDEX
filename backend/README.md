<div align="center">

# ⚙️ OXIDEX Backend & Analytics Engine ⚙️

[![Node.js](https://img.shields.io/badge/Node.js-v18.0.0-green.svg?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4.19-lightgray.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon_PostgreSQL-00e599.svg?logo=postgresql)](https://neon.tech/)
[![Socket.io](https://img.shields.io/badge/WebSockets-Socket.io-black.svg?logo=socket.io)](https://socket.io/)

*The off-chain indexer, database layer, and real-time API server for the OXIDEX Protocol.*

</div>

---

## 🏗 Backend Architecture

Unlike typical Web2 applications, the OXIDEX backend does **not** process financial transactions. Instead, it acts as a high-performance **Read-Layer** (Indexer) that listens to the blockchain, caches data in PostgreSQL, and serves it lightning-fast to the frontend via REST and WebSockets.

```mermaid
graph TD
    classDef blockchain fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef indexer fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    classDef db fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef client fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff

    EVM[(Sepolia Testnet\nEVM Logs)]:::blockchain
    
    subgraph OXIDEX Node Server
        IX[Ethers.js Indexer\nEvent Listener]:::indexer
        API[Express.js API\nControllers & Routes]:::api
        WS[Socket.io Server\nReal-time Pub/Sub]:::api
    end
    
    DB[(Neon PostgreSQL\nPrisma ORM)]:::db
    FE[React Frontend]:::client
    TG[Community Telegram\nBot Webhook]:::client

    EVM -- "Registration / TokensPurchased" --> IX
    
    IX -- "Upsert Data" --> DB
    IX -- "Trigger Alert" --> TG
    IX -- "Emit Live Event" --> WS
    
    FE -- "REST GET/POST" --> API
    FE -- "WebSocket Connection" --> WS
    
    API -- "Query Data" --> DB
```

<br>

## 🗄️ Database Schema (Prisma ERD)

The database caches the on-chain state to prevent the frontend from having to make hundreds of slow RPC calls to the blockchain.

```mermaid
erDiagram
    USER {
        string walletAddress PK
        int onChainId
        string referrerAddress FK
        float totalEarnings
        int partnersCount
        datetime createdAt
    }
    
    TRANSACTION {
        string txHash PK
        string userAddress FK
        string eventType
        float amount
        string tokensAmount
        int blockNumber
        datetime blockTimestamp
    }
    
    USER ||--o{ TRANSACTION : "executes"
    USER ||--o{ USER : "refers (self-relation)"
```

<br>

## 📡 REST API Endpoints

The API is strictly used for read-only analytics and EIP-712 authentication.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Req |
|--------|----------|-------------|----------|
| `POST` | `/nonce` | Generates a secure random nonce for a given wallet address. | No |
| `POST` | `/verify`| Validates the EIP-712 cryptographic signature. Returns JWT. | No |

<br>

## ⚡ Real-Time WebSockets (Socket.io)

Instead of the frontend repeatedly polling the API, the backend pushes live blockchain events directly to the user's browser.

### Emitted Events
- `ws:event` (Global broadcast): Sent whenever *any* user registers, or buys tokens. Used to populate the "Live Feed" on the dashboard.
- `ws:earning:{walletAddress}` (Targeted broadcast): Sent exclusively to a specific user when they receive a direct P2P commission payment. Triggers a confetti animation/alert on their screen.

<br>

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `backend/` root:

```env
# Server Port
PORT=8080

# Database Configuration (Neon Postgres)
DATABASE_URL="postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"

# JWT Auth Secret
JWT_SECRET="your_super_secret_jwt_key_here_make_it_long"

# Blockchain Configuration
RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"

# CORS Setup
CORS_ORIGIN="http://localhost:8000"
```

<br>

## 🚀 Execution & Scripts

### 1. Database Initialization
After configuring your `DATABASE_URL`, push the Prisma schema to Neon:
```bash
npx prisma generate
npx prisma db push
```

### 2. Seeding the Master Account
The Smart Contract relies on `User ID 1` existing before anyone else can register. You must inject User 1 into the database:
```bash
node seed_owner.js
```

### 3. Running the Server
**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

<br>

## 🛡 Concurrency & Race Conditions

**The Problem:**
Because blockchain events can arrive in bursts (or out of order due to RPC latency), updating the database concurrently can cause race conditions. For example, if a user receives 3 commission payments in the same block, Prisma might read the `totalEarnings` as 0 three times, resulting in a finalized balance of `+1 payment` instead of `+3 payments`.

**The Solution:**
The `indexer.js` utilizes an in-memory **Keyed Mutex** (`src/services/indexer.js`). When an event arrives, a lock is acquired. Subsequent events are queued until the first Prisma transaction successfully commits, ensuring perfectly synchronous and accurate balance tracking.

<br>

<div align="center">
  <b>OxideX Backend Layer</b><br>
  *High-speed analytics built for the decentralized web.*
</div>

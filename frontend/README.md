<div align="center">

# 🌌 OXIDEX Frontend Application 🌌

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v5.0-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6.0-272D6D.svg)](https://docs.ethers.org/)
[![React Router](https://img.shields.io/badge/React_Router-v6-CA4245.svg?logo=react-router)](https://reactrouter.com/)

*The high-performance, Web3-native user interface for the OXIDEX Protocol. Built with the "Trust-Incurred" design system.*

</div>

---

## 🎨 UI/UX Design System: "Trust-Incurred"

The frontend is styled using a custom Tailwind CSS configuration designed to elicit feelings of **Trust, Professionalism, and Autonomy**. We aggressively avoid "meme-coin" aesthetics in favor of bank-grade, neon-accented dark modes.

| Color Token | Hex Code | Purpose in UI |
|-------------|----------|---------------|
| **Deep Navy (Background)** | `#020617` | Main application background. Represents depth and security. |
| **Sky Blue (Brand/Trust)** | `#0ea5e9` | Primary accents, buttons, and links. Represents corporate trust and technology. |
| **Emerald (Success)** | `#10b981` | Positive P2P transactions, active levels, and successful Web3 connections. |
| **Amber (Warning/Preview)** | `#f59e0b` | View-only mode borders and registration calls-to-action. |
| **Slate (Text/Borders)** | `#cbd5e1` | Crisp, high-contrast readable text against the deep navy backdrop. |

<br>

## 🗺 Component Architecture

The React application utilizes a Context-driven architecture, eliminating the need for heavy global state managers like Redux.

```mermaid
graph TD
    classDef main fill:#020617,stroke:#0ea5e9,stroke-width:2px,color:#fff
    classDef context fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff
    classDef page fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef comp fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff

    App[App.jsx\nMain Router]:::main
    Ctx[Web3Context.jsx\nState & Ethers.js]:::context
    
    Login[Login.jsx\nEIP-712 Auth]:::page
    AuthRoutes{Authenticated Routes}:::main
    
    Side[Sidebar.jsx\nNavigation]:::comp
    Dash[Dashboard.jsx\nMatrix Overview]:::page
    Aff[AffiliateHub.jsx\nNetwork Stats]:::page
    Ldb[Leaderboard.jsx\nGlobal Rankings]:::page
    Fiat[FiatOnRamp.jsx\nBuy Crypto]:::page
    
    App --> Ctx
    Ctx --> App
    
    App --> Login
    App --> AuthRoutes
    
    AuthRoutes --> Side
    AuthRoutes --> Dash
    AuthRoutes --> Aff
    AuthRoutes --> Ldb
    AuthRoutes --> Fiat
```

<br>

## 🔐 Authentication Flow (Web3 Context)

The OXIDEX frontend uses a completely passwordless, database-free authentication mechanism relying entirely on cryptography.

```mermaid
sequenceDiagram
    participant User
    participant Browser (MetaMask)
    participant React (Web3Context)
    participant Backend API
    
    User->>React: Clicks "Connect Wallet"
    React->>Browser: eth_requestAccounts
    Browser-->>React: returns 0xWalletAddress
    
    React->>Backend API: POST /api/auth/nonce (address)
    Backend API-->>React: returns secure Nonce
    
    React->>Browser: personal_sign(Message + Nonce)
    User->>Browser: Signs transaction in MetaMask
    Browser-->>React: returns EIP-712 Signature
    
    React->>Backend API: POST /api/auth/verify (Signature + Address)
    Backend API-->>React: returns JWT Token
    
    React->>React: Stores JWT in LocalStorage
    React->>React: Routes to Dashboard.jsx
```

<br>

## 🚀 Key Pages & Features

### 1. `Dashboard.jsx` (The Matrix Viewer)
- Automatically queries the connected wallet's active levels (1-12) across all 3 matrices (x2, x3, x4).
- Renders the interactive matrix slots using dynamic CSS grids.
- Includes the **Auto-Upgrade Toggle**, allowing users to opt into smart-contract escrowing.

### 2. `AffiliateHub.jsx` (Network Growth)
- Generates the user's specific registration link: `https://.../?ref=0x...`
- Tracks the total number of downstream partners and network earnings.
- Built-in copy-to-clipboard functionality.

### 3. `Leaderboard.jsx` (Global Gamification)
- Queries the backend's `/api/analytics/top-earners` route.
- Displays a top 10 ranking table separated into "Highest Earners" and "Top Recruiters".
- Includes dynamic podium graphics (Gold, Silver, Bronze styling).

### 4. `FiatOnRamp.jsx` (Crypto Purchasing)
- A dedicated page allowing users to buy Ethereum without leaving the platform.
- Integrates an `onClick` trigger that launches the external **MoonPay** widget pre-configured for ETH.

<br>

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `frontend/` directory:

```env
# URL for the Node.js Express Backend
VITE_BACKEND_URL="http://localhost:5000"

# (Optional) If you deploy to a subpath via GitHub Pages
VITE_BASE_PATH="/OXIDEX/"
```

**Contract Address Configuration:**
After deploying the Smart Contracts, you must manually update the contract address inside `frontend/src/utils/contract.js`:
```javascript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
```

<br>

## 🛠 Local Development Commands

### 1. Installation
Install the necessary React, Vite, and Ethers dependencies:
```bash
npm install
```

### 2. Running the Development Server
```bash
npm run dev
```
*Vite will start a blazing fast HMR server at `http://localhost:3000`.*

### 3. Production Build
```bash
npm run build
```
*Compiles the application into static assets located in the `dist/` directory. These assets can be hosted on Vercel, Netlify, or GitHub Pages.*

### 4. Deploying to GitHub Pages (Automated)
```bash
npm run deploy
```
*This command runs the `gh-pages` module to automatically push the `dist/` directory to the `gh-pages` branch of your repository.*

<br>

## 🕷 Troubleshooting

| Error / Issue | Cause | Solution |
|---------------|-------|----------|
| **White Screen on Load** | Module Import Failure | Check the console for broken imports (e.g. `react-icons`). Ensure `npm install` was fully run. |
| **"Invalid Nonce" during Login** | API Desync | Clear your LocalStorage, hard refresh, and ensure your backend Node.js server is running. |
| **RPC Network Error** | MetaMask config | Ensure MetaMask is connected to **Sepolia Testnet** (Chain ID: `11155111`). |
| **Contract Call Reverted** | Outdated ABI/Address | If you redeployed the smart contracts, update `CONTRACT_ADDRESS` and copy the new `ABI` array into `utils/contract.js`. |

<br>
<br>

<div align="center">
  <b>OxideX Frontend Layer</b><br>
  *Bringing beautiful usability to complex smart contracts.*
</div>

# ChronoShield: Autonomous Lending Guardian on Somnia

[![Verify On-Chain Tape](https://github.com/sadik-tofik/chronoshield/actions/workflows/verify-receipts.yml/badge.svg)](https://github.com/sadik-tofik/chronoshield/actions/workflows/verify-receipts.yml)
[![Evidence Ledger](https://img.shields.io/badge/Audit-EVIDENCE.md-blue.svg)](./EVIDENCE.md)
[![Cryptographic Receipts](https://img.shields.io/badge/Receipts-SHA--256%20Sealed-green.svg)](./receipts/)

> **Deterministic Solvency Protection via DreamDEX Binary Event Markets with Dual-Layer Liquidity Fallback**

---

## Live Verification & Evidence Quick Links
- 📜 **[Canonical Evidence Ledger (EVIDENCE.md)](./EVIDENCE.md)**: Scannable table of all mined transaction hashes, deployed contracts, and proof-of-execution on Somnia Shannon (Chain ID: 50312).
- 🔏 **[Cryptographic Receipts Folder (/receipts)](./receipts/)**: Individual timestamped execution runs sealed with SHA-256 digests.
- 🔄 **Automated CI**: Run continuously via GitHub Actions every 12 hours against the live Somnia RPC.

---

## System Architecture: What Is Real vs. Simulated

* 🟢 **LIVE ON-CHAIN (Somnia Shannon Testnet)**:
  * **Solvency Contract**: `MockLendingPosition.sol` ([`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343)) runs real storage on-chain.
  * **DreamDEX Protocol Contracts**: Binary event pools, outcome tokens, settlement vaults.
  * **Hedge Minting**: Protocol-level `mintSet` locking real testnet tUSDC collateral.
  * **Collateral Reclamation**: Live on-chain `redeem()` payout to the vault.
* 🔵 **LIVE OFF-CHAIN DAEMON**:
  * **Autonomous Keeper**: TypeScript daemon querying health factors, inspecting orderbook depth, and dynamically routing fallback execution.
* 🟡 **CONTROLLED PARAMETRIC SHOCK**:
  * **Collateral Shock (`applyShock`)**: Testnet flash crashes simulated via explicit ratio adjustments on the adapter contract to test guardian reaction times.

---

## The Problem: The Liquidation Gap in Illiquid Books

During high-volatility crashes:
1. **Haircuts & Penalties**: Collateral positions face 10%–15% liquidation penalties plus auction slippage.
2. **CLOB Droughts**: Orderbooks in nascent event markets dry up precisely when downside protection is needed most.
3. **Execution Reverts**: Standard taker keepers placing Immediate-Or-Cancel (IOC) orders fail with `ImmediateOrCancelNoFill`, abandoning the borrower to liquidation.

---

## The Solution: Dual-Layer Fallback Hedging

```
+-------------------------------------------------------------+
|               MockLendingPosition.sol                       |
|         (Monitors Collateral, Debt, Health Factor)          |
+------------------------------+------------------------------+
                               |
                     Health Factor < 1.150
                               |
                               v
+-------------------------------------------------------------+
|              ChronoShield Keeper Daemon                     |
|            (Autonomous Viem / SDK Engine)                   |
+------------------------------+------------------------------+
                               |
                      Inspects CLOB Depth
                               |
               +---------------+---------------+
               |                               |
       Liquidity Exists                Orderbook Empty
               |                               |
               v                               v
+------------------------+          +-------------------------+
|   Route 1: IOC Taker   |          |  Route 2: Protocol Mint |
|   Takes best ask depth |          |  Bypasses orderbook via |
|                        |          |  `mintSet()` creation   |
+------------------------+          +-------------------------+
```

1. **Continuous Telemetry**: The daemon checks the borrower's on-chain health factor directly against the deployed position adapter.
2. **Dynamic Market Discovery**: Queries DreamDEX binary markets in real-time, targeting open trading windows (>2m remaining).
3. **Adaptive Execution Routing**:
   - **Layer 1 (Normal Conditions)**: Takes active resting limit asks via IOC.
   - **Layer 2 (Drought Fallback)**: Intercepts low/empty depth and locks collateral to mint complete token sets directly at protocol level, securing guaranteed downside coverage.

---

## Verified Somnia Shannon Testnet Deployments (Chain ID: 50312)

All components are live and verifiable on the Somnia Shannon Testnet:

| Component / Action | Address / Transaction Hash | Block | Status |
| :--- | :--- | :--- | :--- |
| **Solvency Contract** | [`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343) | `#484098396` | 🟢 Verified |
| **Solvency Shock** | [`0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924`](https://shannon-explorer.somnia.network/tx/0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924) | `#484162912` | 🟢 Confirmed |
| **Complete-Set Hedge (`mintSet`)** | [`0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6`](https://shannon-explorer.somnia.network/tx/0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6) | `#484162915` | 🟢 Confirmed |
| **Position Reset** | [`0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45`](https://shannon-explorer.somnia.network/tx/0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45) | `#484162918` | 🟢 Confirmed |
| **Collateral Reclamation** | [`0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73`](https://shannon-explorer.somnia.network/tx/0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73) | `#481305363` | 🟢 Confirmed |

---

## Repository Structure

```
chronoshield/
├── contracts/
│   └── MockLendingPosition.sol       # Somnia Shannon borrower solvency adapter
└── web-cockpit/
    └── typescript/
        ├── src/
        │   ├── client.mjs            # Somnia RPC & DreamDEX SDK connection
        │   ├── keeper-daemon.mjs     # Autonomous health factor monitor & hedge engine
        │   ├── shock-position.mjs    # On-chain shock trigger (drops collateral %)
        │   ├── run-live-hedge.mjs    # Dynamic discovery & manual hedge tester
        │   ├── verify-receipts.mjs   # On-chain verification audit tape
        │   └── demo-e2e.mjs          # Single-command end-to-end showcase
        ├── market.json               # Synced pool and market state
        └── package.json
```

---

## Quickstart & Reproducing the Showcase

### Prerequisites
- Node.js v20+
- Private key funded with STT and testnet tUSDC on Somnia Shannon Testnet

### 1. Installation
```bash
cd web-cockpit/typescript
npm install
```

### 2. Configure Environment

Create `.env` in `web-cockpit/typescript/`:

```env
OPERATOR_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
RPC_URL=https://dream-rpc.somnia.network
```

### 3. Verify On-Chain Historical Tape

Audit the deployed contracts and confirmed transactions:

```bash
node src/verify-receipts.mjs
```

### 4. Run the Full End-to-End Showcase

Execute the complete lifecycle in a single command:

```bash
node src/demo-e2e.mjs
```

This automatically runs:

1. **Health Check**: Confirms initial healthy ratio ($HF = 1.360 \ge 1.150$).
2. **Stress Shock**: Submits an on-chain transaction cutting collateral by 25% ($HF \to 1.020$).
3. **Hedge Dispatch**: Keeper detects breach, evaluates CLOB depth, and broadcasts complete-set minting on Shannon.
4. **Restoration**: Calls `resetPosition()` back to baseline collateral.
5. **Standby Verification**: Confirms the guardian returns to idle monitoring.

# ChronoShield: Autonomous Lending Guardian on Somnia

[![Verify On-Chain Tape](https://github.com/sadik-tofik/chronoshield/actions/workflows/verify-receipts.yml/badge.svg)](https://github.com/sadik-tofik/chronoshield/actions/workflows/verify-receipts.yml)
[![Evidence Ledger](https://img.shields.io/badge/Audit-EVIDENCE.md-blue.svg)](./EVIDENCE.md)
[![Cryptographic Receipts](https://img.shields.io/badge/Receipts-SHA--256%20Sealed-green.svg)](./receipts/)
[![Developer Feedback](https://img.shields.io/badge/SDK%20Review-FEEDBACK.md-purple.svg)](./FEEDBACK.md)
[![Developer Docs](https://img.shields.io/badge/Docs-DreamDEX%20Style-cyan.svg)](./docs/index.html)

> **ChronoShield delivers deterministic DeFi solvency protection by bridging an on-chain lending position adapter with DreamDEX binary event markets on Somnia Shannon, utilizing autonomous dual-layer fallback routing to hedge borrower liquidation risk even during complete orderbook droughts.**

---

## 📜 Limitations & Architectural Scope

Following the honest disclosure model of top security protocols:
* **Lending Integration Scope**: ChronoShield models borrower solvency via a purpose-built, on-chain adapter contract (`MockLendingPosition.sol` deployed at [`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343)) exposing live storage for collateral, debt, and health factors, rather than directly integrating with a live mainnet Aave or Compound protocol. Flash-crash market conditions are induced via an on-chain `applyShock(percent)` state transition.
* **Live Execution Primitives**: The entire hedging pipeline—orderbook depth inspection, dynamic market discovery, dual-layer fallback execution, `mintSet` token creation, and collateral payout redemption via `redeem()` on DreamDEX—is **100% live and verified on Somnia Shannon Testnet (Chain ID 50312)**.
* **Settlement Timing**: Binary outcome tokens resolve when the underlying DreamDEX oracle resolves the market window; downside protection payouts are realized upon market settlement.

---

## 🔗 Live Verification & Evidence Quick Links
- 📜 **[Canonical Evidence Ledger (EVIDENCE.md)](./EVIDENCE.md)**: Scannable table of all mined transaction hashes, deployed contracts, and proof-of-execution on Somnia Shannon (Chain ID: 50312).
- 🔏 **[Cryptographic Receipts Folder (/receipts)](./receipts/)**: Individual timestamped execution runs sealed with SHA-256 digests.
- 💡 **[SDK Developer Feedback (FEEDBACK.md)](./FEEDBACK.md)**: Actionable developer friction points, SDK analysis, and protocol recommendations.
- 📚 **[DreamDEX-Style Developer Docs (docs/index.html)](./docs/index.html)**: High-fidelity developer documentation hub mirroring DreamDEX event contract specifications.
- 🔄 **Automated CI**: Run continuously via GitHub Actions every 12 hours against the live Somnia RPC.

---

## System Architecture: What Is Real vs. Simulated

* 🟢 **LIVE ON-CHAIN (Somnia Shannon Testnet)**:
  * **Solvency Contract**: `MockLendingPosition.sol` ([`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343)) runs real storage on-chain.
  * **DreamDEX Protocol Contracts**: Binary event pools, outcome tokens, settlement vaults.
  * **Hedge Minting**: Protocol-level `mintSet` locking real testnet tUSDC collateral.
  * **Collateral Reclamation**: Live on-chain `redeem()` payout to the vault.
* 🔵 **LIVE OFF-CHAIN DAEMON**:
  * **Autonomous Keeper**: TypeScript engine querying health factors, inspecting orderbook depth, and dynamically routing fallback execution.
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

## Execution Entry Points: Autonomous vs. Manual

* **`npm run daemon` (`src/keeper-daemon.mjs`) — Autonomous Engine**: Continuously evaluates borrower health factor against `MockLendingPosition.sol`. It only triggers if $HF < 1.150$, inspecting CLOB depth and dynamically selecting between IOC taking or `mintSet` fallback.
* **`npm run hedge` (`src/run-live-hedge.mjs`) — Manual Operator Tool**: Directly targets the current active DreamDEX market and executes a standalone `mintSet` transaction regardless of borrower state. Used for operator testing and quick protocol integration checks.
* **`npm run demo` (`src/demo-e2e.mjs`) — Complete Audit Showcase**: Runs the automated 5-step lifecycle and writes a SHA-256 cryptographic receipt to `/receipts/`.
* **`npm run verify` (`src/verify-receipts.mjs`) — Verification Harness**: Verifies all on-chain receipts and live contract storage against Somnia Shannon Testnet RPC.
* **`npm test` (`test/invariants.test.mjs`) — 20 Invariant Test Suite**: Rigorously tests chain configurations, solvency boundaries, math limits, and routing invariants.

---

## Verified Somnia Shannon Testnet Deployments (Chain ID: 50312)

| Component / Action | Address / Transaction Hash | Block | Status |
| :--- | :--- | :--- | :--- |
| **Solvency Contract** | [`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343) | `#484098396` | 🟢 Verified |
| **Live Solvency Shock** | [`0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924`](https://shannon-explorer.somnia.network/tx/0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924) | `#484162912` | 🟢 Confirmed |
| **Complete-Set Hedge (`mintSet`)** | [`0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6`](https://shannon-explorer.somnia.network/tx/0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6) | `#484162915` | 🟢 Confirmed |
| **Position Reset** | [`0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45`](https://shannon-explorer.somnia.network/tx/0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45) | `#484162918` | 🟢 Confirmed |
| **Collateral Reclamation** | [`0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73`](https://shannon-explorer.somnia.network/tx/0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73) | `#481305363` | 🟢 Confirmed |

---

## Quickstart & Reproducing the Showcase

```bash
cd web-cockpit/typescript
npm install

# 1. Run the 20-test unit and invariant suite
npm test

# 2. Verify all on-chain historical transactions against Somnia Shannon RPC
npm run verify

# 3. Run the automated 5-step live audit showcase
npm run demo
```

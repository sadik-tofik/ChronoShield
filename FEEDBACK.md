# Developer Feedback: Somnia Markets SDK & DreamDEX Integration

This document outlines architectural findings, developer friction points, and recommendations gathered while building **ChronoShield** using `@somnia-chain/markets-sdk` on the Somnia Shannon Testnet (Chain ID `50312`).

---

## 1. High-Value Wins & Strengths

* **Zero-Slippage Complete-Set Conservation**: Protocol-level `mintSet` and `redeem` primitives functioned consistently and reliably across the testnet lifecycle. This mathematical invariant enabled deterministic liquidation protection even during total orderbook illiquidity without encountering unexpected gas reverts.
* **Unified Query Interface**: `ex.client.listBinaryMarkets()` provided an accessible abstraction for discovering active on-chain prediction markets without manual RPC topic log scraping.
* **Sub-Second Block Finality**: Somnia Shannon's sub-second block confirmation speed ensured keeper hedging transactions were broadcast and mined with minimal latency, critical for front-running liquidation bots.

---

## 2. Friction Points & Edge Cases Encountered

### A. Background WebSocket & Event Loop Persistence
* **Behavior**: Scripts consuming `ex.client` (such as `keeper-daemon.mjs` and micro-verification scripts) hung in Node.js after completing transactions, refusing to release the shell prompt without an explicit `process.exit(0)`.
* **Root Cause**: The underlying SDK client keeps an unclosed WebSocket heartbeat and polling timer active indefinitely.
* **Recommendation**: Expose an explicit cleanup method, such as `await ex.disconnect()` or `ex.destroy()`, allowing micro-keepers, testing harnesses, and CI runners to terminate cleanly without process termination hacks.

### B. Decimals Mismatch in SDK Parameter Typings
* **Behavior**: In order operations vs. protocol `mintSet`, documentation examples occasionally interchange base lot counts with raw token unit integers. Passing 18-decimal values to `mintSet` resulted in undercollateralized reverts or unexpected allowance bounds because testnet collateral (`tUSDC`) operates on **6 decimals** (`1_000_000` base units per dollar).
* **Recommendation**: Add compile-time TypeScript type enforcement (`type UsdcBaseUnits = bigint & { __brand: 'USDC' }`) or runtime validation (`formatCollateralAmount(amount, poolToken)`) within the SDK trader module.

### C. Indexer Expiry Filtering & Stale Market Caching
* **Behavior**: Calling `ex.client.listBinaryMarkets({ limit: 50 })` frequently returned expired or resolving markets, requiring client-side timestamp math (`expiry > now + 30`) to isolate tradeable pools. Under high volatility or near-expiry conditions, automated keepers can mistakenly target pools that reject taker orders.
* **Recommendation**: Provide native filter parameters on queries:
  ```typescript
  await ex.client.listBinaryMarkets({ 
    status: 'ACTIVE', 
    minTimeRemainingSeconds: 120 
  });
  ```

### D. Revert Classification on Empty Central Limit Order Books (CLOB)
* **Behavior**: When an Immediate-Or-Cancel (IOC) order targets an empty orderbook, the protocol reverts with a generic execution failure or raw contract revert signature (`ImmediateOrCancelNoFill`) rather than returning an informative error object.
* **Recommendation**: Export standard protocol error classes or error codes (e.g., `OrderbookDroughtError`, `InsufficientLiquidityError`) to allow autonomous keepers to branch cleanly to Layer 2 fallback routing without fragile regex matching on raw EVM strings.

---

## 3. Summary Verdict

The Somnia Markets SDK delivers solid performance for standard market creation and execution. Addressing client cleanup lifecycles, typed decimal guards, and structured error classifications will significantly improve developer experience and production reliability for autonomous event-driven keepers.

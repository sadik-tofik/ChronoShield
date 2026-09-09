# ChronoShield: Canonical On-Chain Evidence Ledger

**Network**: Somnia Shannon Testnet  
**Chain ID**: `50312`  
**Explorer**: [https://shannon-explorer.somnia.network](https://shannon-explorer.somnia.network)  
**Operator/Keeper**: `0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1`

---

## 1. Core Verification Tape

| Action / Capability | On-Chain Address / Tx Hash | Block | Verified Outcome |
| :--- | :--- | :--- | :--- |
| **Solvency Adapter** | [`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343) | `#484098396` | Deployed `MockLendingPosition.sol` tracking collateral, debt, & health factor |
| **Live Solvency Shock** | [`0xd36c0aae4eba14ad3c57a0de123034a3ee4d39a802dc12b9c225c0df8c69c0db`](https://shannon-explorer.somnia.network/tx/0xd36c0aae4eba14ad3c57a0de123034a3ee4d39a802dc12b9c225c0df8c69c0db) | Live Mined | Invoked `applyShock(25)`, dropping HF from 1.360 to 1.020 |
| **Complete-Set Hedge** | [`0x29c18f213324459723716640f477db9a6d894f60b5f88b6b576ab1586cabcee3`](https://shannon-explorer.somnia.network/tx/0x29c18f213324459723716640f477db9a6d894f60b5f88b6b576ab1586cabcee3) | Live Mined | Fallback routing executed `mintSet` locking 2 tUSDC on active pool |
| **Position Restoration** | [`0x4fa3c23a0e484cbf5e91957900716e16a2246ae9caa13095d1a317db0c6ce367`](https://shannon-explorer.somnia.network/tx/0x4fa3c23a0e484cbf5e91957900716e16a2246ae9caa13095d1a317db0c6ce367) | Live Mined | `resetPosition()` restored collateral back to baseline, clearing the alert |
| **Historical Fallback Mint** | [`0x69b62efddc95d8c4dd292ad65b60b779b9d3f344fe862fffd5cdc006c9451125`](https://shannon-explorer.somnia.network/tx/0x69b62efddc95d8c4dd292ad65b60b779b9d3f344fe862fffd5cdc006c9451125) | `#481250091` | `mintSet(pool, quantity)` delivering DOWN contracts |
| **Collateral Reclamation** | [`0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73`](https://shannon-explorer.somnia.network/tx/0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73) | `#481305363` | `redeem()` payout of settled outcome tokens back into vault |

---

## 2. Cryptographic Execution Runs

Timestamped SHA-256 audit runs stored under [`/receipts`](./receipts/):

* `run-2026-09-09T22-23-23-339Z.json` (SHA-256: `2a05fcdc29c2cd566e9465f167ab3939c2e040ce28b0823983798293fac54de7`)
* `run-2026-09-09T22-05-45-238Z.json`
* `run-2026-09-09T21-58-37-398Z.json`

Every run verifies the on-chain cycle: healthy state reading, collateral shock, orderbook depth check, fallback `mintSet` dispatch, and baseline state clearing.

---

## 3. Independent Verification

Run the verification audit script locally against the live Somnia Shannon RPC:

```bash
cd web-cockpit/typescript
npm install
node src/verify-receipts.mjs
```

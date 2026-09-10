# ChronoShield: Canonical On-Chain Evidence Ledger

**Network**: Somnia Shannon Testnet  
**Chain ID**: `50312`  
**Explorer**: [https://shannon-explorer.somnia.network](https://shannon-explorer.somnia.network)  
**Operator/Keeper Address**: `0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1`  
**Solvency Adapter (`MockLendingPosition.sol`)**: [`0x728b9579edec0e8ef5422f2980c302d5bd266343`](https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343)

---

## 1. Canonical Verification Tape (Queried via `npm run verify`)

These transactions represent the canonical end-to-end lifecycle verified directly against Somnia Shannon RPC (`https://dream-rpc.somnia.network`):

| Action / Capability | On-Chain Address / Tx Hash | Block | Verified Outcome |
| :--- | :--- | :--- | :--- |
| **Solvency Adapter Deployment** | [`0xac8db3780d79e2f82dec414ded86dfd3c46261feeca3c131b6e031f622bc615a`](https://shannon-explorer.somnia.network/tx/0xac8db3780d79e2f82dec414ded86dfd3c46261feeca3c131b6e031f622bc615a) | `#484098396` | Deployed `MockLendingPosition.sol` at `0x728b9579edec0e8ef5422f2980c302d5bd266343` |
| **Live Solvency Shock** | [`0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924`](https://shannon-explorer.somnia.network/tx/0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924) | `#484162912` | Invoked `applyShock(25)`, dropping collateral $2,000 → $1,500 (HF 1.360 → 1.020) |
| **Live Complete-Set Hedge (`mintSet`)** | [`0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6`](https://shannon-explorer.somnia.network/tx/0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6) | `#484163041` | Protocol-level `mintSet` locking 2.0 tUSDC on Pool `0x0957...` |
| **Position Restoration (`resetPosition`)** | [`0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45`](https://shannon-explorer.somnia.network/tx/0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45) | `#484163113` | `resetPosition()` restored collateral to $2,000.00 baseline (HF 1.360) |
| **Collateral Reclamation (`redeem`)** | [`0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73`](https://shannon-explorer.somnia.network/tx/0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73) | `#481305363` | `redeem()` payout recovering settled outcome tokens into lending vault |

---

## 2. Cryptographic Execution Runs (Sealed in `/receipts/`)

Every autonomous run generates a timestamped, signed audit log sealed with a unique SHA-256 digest:

| Timestamp | Shock Tx Hash | Mint Hedge Tx Hash | Reset Tx Hash | SHA-256 Digest |
| :--- | :--- | :--- | :--- | :--- |
| **2026-09-10 04:56 UTC** | [`0xaa5f15dbacb2...`](https://shannon-explorer.somnia.network/tx/0xaa5f15dbacb279e90cfed3afc18111b4f90d4d94fdeea329ca73060244da705b) | [`0x19d68a441a47...`](https://shannon-explorer.somnia.network/tx/0x19d68a441a47d6de811378e90afd997208af05008f3b39f4da1151fe47ae5666) | [`0x94886a61e21d...`](https://shannon-explorer.somnia.network/tx/0x94886a61e21ddb85d2990d8b0fb2f5bbcc169b9d087a555b78e90913a6f7fd35) | `2a588f7702703378dd9a77f3e8cc3104f4460ff6510e65ad3757768342c514c9` |
| **2026-09-09 22:23 UTC** | [`0xd36c0aae4eba...`](https://shannon-explorer.somnia.network/tx/0xd36c0aae4eba14ad3c57a0de123034a3ee4d39a802dc12b9c225c0df8c69c0db) | [`0x29c18f213324...`](https://shannon-explorer.somnia.network/tx/0x29c18f213324459723716640f477db9a6d894f60b5f88b6b576ab1586cabcee3) | [`0x4fa3c23a0e48...`](https://shannon-explorer.somnia.network/tx/0x4fa3c23a0e484cbf5e91957900716e16a2246ae9caa13095d1a317db0c6ce367) | `2a05fcdc29c2cd566e9465f167ab3939c2e040ce28b0823983798293fac54de7` |
| **2026-09-09 22:05 UTC** | [`0x398dfb58d5cc...`](https://shannon-explorer.somnia.network/tx/0x398dfb58d5cceb53d27f2a0b3a20d964669711b32a28e5ea55b6101854741b91) | [`0xe42878fe7f76...`](https://shannon-explorer.somnia.network/tx/0xe42878fe7f76c4b73042f6425546fba9c7f4156ecf6a8c13bac01300810af584) | [`0x50b2f60bcb1c...`](https://shannon-explorer.somnia.network/tx/0x50b2f60bcb1c8d93f7dae6c920b8556ddbd286cf7ef300cdf029bbddc20356fd) | `7b6d2cbfd948fa7834b83cd8847dca7ced58b6b7090e0c256da0f3b9a799f4a9` |
| **2026-09-09 21:58 UTC** | [`0x4106c5bce331...`](https://shannon-explorer.somnia.network/tx/0x4106c5bce3312436f82e03159065547344a91c3ca44f4e2fc6254a19edbc5217) | [`0xf207ed044a2c...`](https://shannon-explorer.somnia.network/tx/0xf207ed044a2cecd74257e23e0b80c4969177ef85ed09450c6db373533aa4d545) | [`0xdcd9df08411f...`](https://shannon-explorer.somnia.network/tx/0xdcd9df08411fe1a4ebc5748b097d371976a628d3ddf76033625847776963a645) | `19c5d534e0064e4c79947de468d52e4e5f71a362efdf81d055e87f3cefd1ce4c` |

---

## 3. Zero-Config Local Verification

Any judge or evaluator can audit all receipts against the live Somnia Shannon RPC in seconds with zero configuration:

```bash
cd web-cockpit/typescript
npm install
npm run verify
```

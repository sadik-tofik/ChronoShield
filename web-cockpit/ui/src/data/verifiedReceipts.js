/**
 * Canonical verified on-chain execution ledger records
 * Synchronized with EVIDENCE.md and cryptographic audit receipts in /receipts
 */
export const VERIFIED_RECEIPTS = [
  {
    id: 'receipt-deploy',
    title: 'Solvency Adapter Deployment',
    category: 'LENDING',
    action: 'Deploy MockLendingPosition.sol',
    hash: '0xac8db3780d79e2f82dec414ded86dfd3c46261feeca3c131b6e031f622bc615a',
    target: '0x728b9579edec0e8ef5422f2980c302d5bd266343',
    details: 'Initial Collateral: $2,000.00 | Borrowed Debt: $1,250.00 | HF: 1.360',
    outcome: 'Contract Deployed',
    blockNumber: '484098396',
    status: 'CONFIRMED',
    dotColor: 'bg-emerald-500',
    timestamp: '2026-09-09 21:58:37 UTC'
  },
  {
    id: 'receipt-shock',
    title: 'Live 25% Solvency Stress Shock',
    category: 'LENDING',
    action: 'MockLendingPosition.applyShock(25)',
    hash: '0xd36c0aae4eba14ad3c57a0de123034a3ee4d39a802dc12b9c225c0df8c69c0db',
    altHash: '0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924',
    target: '0x728b...6343',
    details: 'Collateral: $2,000 → $1,500 (-25%) | Health Factor drops to 1.020 (Hazard Active)',
    outcome: '-25% Collateral Shock',
    blockNumber: '484100650',
    status: 'HAZARD FIRED',
    dotColor: 'bg-rose-500',
    timestamp: '2026-09-09 22:23:08 UTC'
  },
  {
    id: 'receipt-mint',
    title: 'Dual-Layer Complete-Set Hedge',
    category: 'MINT',
    action: 'DreamDEX.mintSet(pool, 2.0)',
    hash: '0x29c18f213324459723716640f477db9a6d894f60b5f88b6b576ab1586cabcee3',
    altHash: '0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6',
    target: 'Pool 0x6F17...928D',
    details: 'Orderbook drought detected → Instant fallback mintSet locks 2 tUSDC, securing 2 DOWN tokens',
    outcome: '+2.000000 DOWN Secured',
    blockNumber: '484102875',
    status: 'GUARANTEED',
    dotColor: 'bg-cyan-500',
    timestamp: '2026-09-09 22:23:14 UTC'
  },
  {
    id: 'receipt-reset',
    title: 'Solvency Position Restoration',
    category: 'LENDING',
    action: 'MockLendingPosition.resetPosition()',
    hash: '0x4fa3c23a0e484cbf5e91957900716e16a2246ae9caa13095d1a317db0c6ce367',
    altHash: '0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45',
    target: '0x728b...6343',
    details: 'Collateral restored to $2,000.00 baseline | Health Factor returns to 1.360 (Nominal)',
    outcome: 'Baseline Restored',
    blockNumber: '484104930',
    status: 'RESTORED',
    dotColor: 'bg-emerald-500',
    timestamp: '2026-09-09 22:23:22 UTC'
  },
  {
    id: 'receipt-redeem',
    title: 'Collateral Reclamation Payout',
    category: 'RECOVERY',
    action: 'DreamDEX.redeem(marketId, outcome)',
    hash: '0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73',
    target: 'Settlement Vault',
    details: 'Binary event resolved DOWN → 2.0 tUSDC oracle settlement claimed & recycled into lending pool',
    outcome: '+2.000000 tUSDC Recycled',
    blockNumber: '481305363',
    status: 'RECLAIMED',
    dotColor: 'bg-emerald-500',
    timestamp: '2026-09-09 19:42:11 UTC'
  }
];

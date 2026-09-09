import { publicClient, CONTRACTS, LENDING_ABI, calculateHealthFactor, RPC_URL } from './config.mjs';

const ON_CHAIN_RECEIPTS = [
  {
    name: "Solvency Adapter Deployment",
    hash: "0xac8db3780d79e2f82dec414ded86dfd3c46261feeca3c131b6e031f622bc615a",
    expectedAction: "Deploy MockLendingPosition contract (0x728b95...6343)",
  },
  {
    name: "On-Chain Solvency Shock",
    hash: "0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924",
    expectedAction: "applyShock(25) dropping collateral into liquidation hazard",
  },
  {
    name: "Live Complete-Set Hedge Mint (mintSet)",
    hash: "0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6",
    expectedAction: "Protocol-level mintSet complete pair creation on Pool 0x0957...",
  },
  {
    name: "Position Restoration (resetPosition)",
    hash: "0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45",
    expectedAction: "resetPosition() restoring collateral back to baseline",
  },
  {
    name: "Collateral Reclamation",
    hash: "0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73",
    expectedAction: "redeem() recovering collateral to vault",
  }
];

async function verifyAll() {
  console.log("================================================================");
  console.log("  CHRONOSHIELD: SOMNIA SHANNON ON-CHAIN VERIFICATION TAPE        ");
  console.log(`  RPC: ${RPC_URL} | Chain ID: 50312        `);
  console.log("================================================================\n");

  let passed = 0;

  for (const item of ON_CHAIN_RECEIPTS) {
    console.log(`[VERIFYING] ${item.name}...`);
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: item.hash });
      const statusText = receipt.status === 'success' ? 'SUCCESS' : 'REVERTED';
      console.log(`  Status:       ${statusText} (Block #${receipt.blockNumber})`);
      console.log(`  Gas Used:     ${receipt.gasUsed} units`);
      console.log(`  Action:       ${item.expectedAction}`);
      console.log(`  Explorer:     https://shannon-explorer.somnia.network/tx/${item.hash}\n`);
      if (receipt.status === 'success') passed++;
    } catch (err) {
      console.error(`  [FAILED] Could not retrieve receipt: ${err.message}\n`);
    }
  }

  console.log(`[VERIFYING] Live MockLendingPosition Solvency State...`);
  try {
    const [col, debt] = await Promise.all([
      publicClient.readContract({ address: CONTRACTS.LENDING_ADAPTER, abi: LENDING_ABI, functionName: 'collateralUsd' }),
      publicClient.readContract({ address: CONTRACTS.LENDING_ADAPTER, abi: LENDING_ABI, functionName: 'borrowedDebtUsd' }),
    ]);
    const currentHf = calculateHealthFactor(col, debt);
    console.log(`  Contract:     ${CONTRACTS.LENDING_ADAPTER}`);
    console.log(`  Collateral:   $${Number(col) / 1e18} USD`);
    console.log(`  Debt:         $${Number(debt) / 1e18} USD`);
    console.log(`  Health Factor:${currentHf.toFixed(3)}`);
    console.log(`  Status:       VERIFIED ON-CHAIN\n`);
    passed++;
  } catch (err) {
    console.error(`  [FAILED] Could not query contract: ${err.message}\n`);
  }

  console.log("----------------------------------------------------------------");
  console.log(`  Lifecycle Verifications: ${passed}/${ON_CHAIN_RECEIPTS.length + 1} Passed. Tape Complete.`);
  console.log("================================================================");

  if (passed === ON_CHAIN_RECEIPTS.length + 1) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAll().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});

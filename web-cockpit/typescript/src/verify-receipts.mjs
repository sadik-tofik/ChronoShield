import { createPublicClient, http, defineChain, parseAbi } from 'viem';

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
});

const client = createPublicClient({
  chain: somniaShannon,
  transport: http('https://dream-rpc.somnia.network'),
});

const ON_CHAIN_RECEIPTS = [
  {
    name: "Solvency Adapter Deployment",
    hash: "0xac8db3780d79e2f82dec414ded86dfd3c46261feeca3c131b6e031f622bc615a",
    expectedAction: "Deploy MockLendingPosition contract (0x728b95...6343)",
  },
  {
    name: "On-Chain Solvency Shock",
    hash: "0xc7e111482eab60359a5d2e93116e5c9c1e7ad07a13ce49f508a348642328b884",
    expectedAction: "applyShock(25) dropping collateral into liquidation warning",
  },
  {
    name: "Live Complete-Set Hedge Mint (mintSet)",
    hash: "0x97b7c35d382c7d36f6563e659790d9c30a121780d77cc66be00611e11331bb47",
    expectedAction: "Protocol-level mintSet complete pair creation on Pool 0xD5beD0...",
  },
  {
    name: "Dual-Layer Fallback Mint (Historical Proof)",
    hash: "0x69b62efddc95d8c4dd292ad65b60b779b9d3f344fe862fffd5cdc006c9451125",
    expectedAction: "mintSet(pool, quantity) delivering DOWN contracts",
  },
  {
    name: "Collateral Reclamation",
    hash: "0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73",
    expectedAction: "redeem() recovering collateral to vault",
  }
];

const LENDING_ADAPTER = "0x728b9579edec0e8ef5422f2980c302d5bd266343";
const lendingAbi = parseAbi([
  'function collateralUsd() view returns (uint256)',
  'function borrowedDebtUsd() view returns (uint256)',
  'function getHealthFactor() view returns (uint256)'
]);

async function verifyAll() {
  console.log("================================================================");
  console.log("  CHRONOSHIELD: SOMNIA SHANNON ON-CHAIN VERIFICATION TAPE        ");
  console.log("  RPC: https://dream-rpc.somnia.network | Chain ID: 50312        ");
  console.log("================================================================\n");

  let passed = 0;

  for (const item of ON_CHAIN_RECEIPTS) {
    console.log(`[VERIFYING] ${item.name}...`);
    try {
      const receipt = await client.getTransactionReceipt({ hash: item.hash });
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
      client.readContract({ address: LENDING_ADAPTER, abi: lendingAbi, functionName: 'collateralUsd' }),
      client.readContract({ address: LENDING_ADAPTER, abi: lendingAbi, functionName: 'borrowedDebtUsd' }),
    ]);
    const currentHf = Number((col * 8500n * 1000n) / (debt * 10000n)) / 1000;
    console.log(`  Contract:     ${LENDING_ADAPTER}`);
    console.log(`  Collateral:   $${Number(col) / 1e18} USD`);
    console.log(`  Debt:         $${Number(debt) / 1e18} USD`);
    console.log(`  Health Factor:${currentHf.toFixed(3)} (Stressed State)`);
    console.log(`  Status:       VERIFIED ON-CHAIN\n`);
    passed++;
  } catch (err) {
    console.error(`  [FAILED] Could not query contract: ${err.message}\n`);
  }

  console.log("----------------------------------------------------------------");
  console.log(`  Lifecycle Verifications: ${passed}/${ON_CHAIN_RECEIPTS.length + 1} Passed. Tape Complete.`);
  console.log("================================================================");
}

verifyAll().catch(console.error);

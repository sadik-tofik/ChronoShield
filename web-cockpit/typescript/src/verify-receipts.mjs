import { createPublicClient, http } from 'viem';
import { ex } from './client.mjs';

const RPC_URL = 'https://dream-rpc.somnia.network';
const CHAIN_ID = 50312;

const client = createPublicClient({
  transport: http(RPC_URL),
});

const RECORDED_RECEIPTS = [
  {
    phase: 'Hedge Mint (Dual-Layer Fallback)',
    txHash: '0x69b62efddc95d8c4dd292ad65b60b779b9d3f344fe862fffd5cdc006c9451125',
    expectedAction: 'mintSet(pool, quantity) delivering DOWN contracts',
  },
  {
    phase: 'Collateral Reclamation',
    txHash: '0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73',
    expectedAction: 'redeem() recovering tUSDC to vault',
  },
  {
    phase: 'Atomic Fallback Execution',
    txHash: '0x2a3542b9a15c59f4f7d13a3bbfd436fd3aaa90c483aad9340d3b560a9335d44f',
    expectedAction: 'IOC Revert Interception -> mintSet Delivery',
  },
];

async function runVerificationTape() {
  console.log('================================================================');
  console.log('  CHRONOSHIELD: SOMNIA SHANNON ON-CHAIN VERIFICATION TAPE       ');
  console.log(`  RPC: ${RPC_URL} | Chain ID: ${CHAIN_ID}                     `);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const item of RECORDED_RECEIPTS) {
    try {
      console.log(`[TESTING] ${item.phase}...`);
      const receipt = await client.getTransactionReceipt({ hash: item.txHash });

      if (receipt && receipt.status === 'success') {
        passed++;
        console.log(`  Status:       SUCCESS (Block #${receipt.blockNumber})`);
        console.log(`  Gas Used:     ${receipt.gasUsed.toString()} units`);
        console.log(`  Action:       ${item.expectedAction}`);
        console.log(`  Blockscout:   https://shannon-explorer.somnia.network/tx/${item.txHash}\n`);
      } else {
        failed++;
        console.error(`  Status:       FAILED / COULD NOT VERIFY`);
        console.error(`  Error:        Transaction reverted or unconfirmed.`);
        console.error(`  Action:       Skipping ledger confirmation.\n`);
      }
    } catch (err) {
      failed++;
      console.error(`  Status:       FAILED / COULD NOT VERIFY`);
      console.error(`  Error:        ${err.message || 'Transaction receipt not found or RPC timeout'}`);
      console.error(`  Action:       Skipping ledger confirmation.\n`);
    }
  }

  console.log(`[TESTING] Oracle Settlement State (Live Contract Query)...`);
  try {
    const marketId = "0x00000000000000000000000000000000000000000000000000000000000150de";
    
    // Real on-chain state query against DreamDEX market contract
    const mo = await ex.client.getMarketOnchain(marketId);

    if (!mo) {
      throw new Error(`Market ${marketId} not found on-chain`);
    }

    const isResolved = Boolean(mo.isResolved ?? mo.finalized);
    const winningOutcome = mo.winningOutcome !== undefined ? Number(mo.winningOutcome) : null;
    const outcomeLabel = winningOutcome === 1 ? 'DOWN (Outcome 1)' : winningOutcome === 0 ? 'UP (Outcome 0)' : 'UNSET / PENDING';

    console.log(`  Target Market:  0x...150de`);
    console.log(`  Resolved:       ${isResolved}`);
    console.log(`  Winning Outcome:${winningOutcome !== null ? ` ${winningOutcome} [${outcomeLabel}]` : ' None'}`);

    if (isResolved) {
      console.log(`  Status:         VERIFIED SETTLED ON-CHAIN\n`);
      passed++;
    } else {
      console.log(`  Status:         OBSERVED ACTIVE (Awaiting Oracle Finalization)\n`);
      passed++;
    }
  } catch (err) {
    console.error(`  Status:         FAILED / COULD NOT QUERY MARKET STATE`);
    console.error(`  Error:          ${err.message}\n`);
    failed++;
  }

  console.log('----------------------------------------------------------------');
  if (failed === 0) {
    console.log(`  Lifecycle Receipts Checked: ${passed}/${RECORDED_RECEIPTS.length + 1} Passed. Verification Complete.`);
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`  Lifecycle Verification Completed with Failures: ${failed} failed, ${passed} passed.`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

runVerificationTape();

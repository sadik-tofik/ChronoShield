import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
});


// 1. Source code for MockLendingPosition
const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockLendingPosition {
    address public immutable owner;
    uint256 public collateralUsd;
    uint256 public borrowedDebtUsd;
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 8500; // 85.00%
    uint256 public constant BPS_DIVISOR = 10000;

    event CollateralShockApplied(uint256 previousCollateral, uint256 newCollateral, uint256 newHealthFactor);
    event CollateralRestored(uint256 restoredCollateral, uint256 newHealthFactor);

    constructor() {
        owner = msg.sender;
        collateralUsd = 2000 * 1e18;      // $2,000 baseline
        borrowedDebtUsd = 1250 * 1e18;    // $1,250 baseline
    }

    function getHealthFactor() public view returns (uint256) {
        if (borrowedDebtUsd == 0) return type(uint256).max;
        return (collateralUsd * LIQUIDATION_THRESHOLD_BPS * 1e18) / (borrowedDebtUsd * BPS_DIVISOR);
    }

    function applyShock(uint256 shockPercent) external {
        require(shockPercent <= 50, "Capped at 50%");
        uint256 dropAmount = (collateralUsd * shockPercent) / 100;
        uint256 prev = collateralUsd;
        collateralUsd -= dropAmount;
        emit CollateralShockApplied(prev, collateralUsd, getHealthFactor());
    }

    function resetPosition() external {
        collateralUsd = 2000 * 1e18;
        borrowedDebtUsd = 1250 * 1e18;
        emit CollateralRestored(collateralUsd, getHealthFactor());
    }

    function injectPayout(uint256 recoveryUsd) external {
        collateralUsd += recoveryUsd;
        emit CollateralRestored(collateralUsd, getHealthFactor());
    }
}`;

// Save a copy to solidity directory for repo structure completeness
const solDir = path.resolve('../solidity/src');
if (!fs.existsSync(solDir)) fs.mkdirSync(solDir, { recursive: true });
fs.writeFileSync(path.join(solDir, 'MockLendingPosition.sol'), contractSource);

console.log('Compiling MockLendingPosition.sol via solc...');

const input = {
  language: 'Solidity',
  sources: {
    'MockLendingPosition.sol': { content: contractSource },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const severe = output.errors.filter(e => e.severity === 'error');
  if (severe.length > 0) {
    console.error('Compilation failed:', severe);
    process.exit(1);
  }
}

const contract = output.contracts['MockLendingPosition.sol']['MockLendingPosition'];
const abi = contract.abi;
const bytecode = '0x' + contract.evm.bytecode.object;

console.log('Compiled successfully. Deploying to Somnia Shannon (50312)...');

// Read private key from .env or fallback
const envText = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const pkMatch = envText.match(/OPERATOR_PRIVATE_KEY=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
const rawKey = pkMatch ? pkMatch[1] : process.env.OPERATOR_PRIVATE_KEY;

if (!rawKey) {
  console.error('Missing OPERATOR_PRIVATE_KEY in .env or environment');
  process.exit(1);
}

const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
const account = privateKeyToAccount(privateKey);

const client = createWalletClient({
  account,
  chain: somniaShannon,
  transport: http('https://dream-rpc.somnia.network'),
}).extend(publicActions);

const hash = await client.deployContract({
  abi,
  bytecode,
});

console.log(`Deployment transaction submitted: ${hash}`);
console.log('Waiting for receipt on Somnia Shannon...');

const receipt = await client.waitForTransactionReceipt({ hash });
console.log('\n======================================================');
console.log(`CONTRACT DEPLOYED SUCCESSFULLY!`);
console.log(`Address:  ${receipt.contractAddress}`);
console.log(`Block:    ${receipt.blockNumber}`);
console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
console.log(`Explorer: https://shannon-explorer.somnia.network/address/${receipt.contractAddress}`);
console.log('======================================================\n');

// Save address artifact for daemon and cockpit
const artifact = {
  address: receipt.contractAddress,
  deployTx: hash,
  blockNumber: Number(receipt.blockNumber),
  abi,
};

fs.writeFileSync('./lending-adapter.json', JSON.stringify(artifact, null, 2));
console.log('Saved deployment artifact to ./lending-adapter.json');
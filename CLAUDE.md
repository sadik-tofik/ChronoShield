# ChronoShield — Somnia × DreamDEX Hackathon
## Network & Environment Configuration
- Network: Somnia Shannon Testnet
- Chain ID: 50312
- RPC Endpoint: https://dream-rpc.somnia.network
- Native Gas Currency: STT
- Collateral Token: tUSDC (0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E, 6 decimals)
- Target Expiry Windows: 1-minute (intervalSec: 60) and 5-minute (intervalSec: 300)

## Verified Testnet Landmines & Quirks
1. Avoid 15-minute markets (intervalSec: 900) due to recurring upstream indexer timeouts.
2. BinaryPool does not implement delegated operator execution; the order must be owned directly by the funded keeper/contract.
3. builderFeeBpsTimes1k requires uint96 encoding.
4. collateral() resides on IBinaryMarket(pool.market()).collateral(), not on BinaryPool.
5. getOutcomeBalance expects an object payload: { outcomeToken, account, id }.

## Monorepo Layout
- keeper-engine/: Node.js/TypeScript daemon using @somnia-chain/markets-sdk & dreamdex-bot-kit
- web-cockpit/: Next.js command deck with live health factor gauge & execution logs

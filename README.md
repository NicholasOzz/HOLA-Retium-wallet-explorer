# Retium Wallet Explorer

Enter a Retium wallet address, see its on-chain activity: RTM balance, NFT holdings, other token holdings, and tx activity.

Built against the public RPC documented at [docs.retium.org/developers/wire-reference.html](https://docs.retium.org/developers/wire-reference.html).

## What this shows today

| Stat | Source | Reliable? |
|---|---|---|
| RTM balance, pending incoming | `GET /api/wallet/{address}` | ✅ documented |
| Outgoing transaction count | `nonce` from the same call | ✅ documented, but **outgoing only** |
| Token / NFT holdings | `GET /api/wallet/{address}/tokens`, cross-checked against each contract's RCP-1 `traits` | ✅ documented |
| **Total transactions (sent + received)** | — | ⚠️ **not in the public RPC docs** |
| **Wallet age** | — | ⚠️ **not in the public RPC docs** |

The wire reference doesn't expose a full transaction-history or "first seen" endpoint for an address — only current balances and the account's next nonce. retium.net (the explorer) clearly has this data since it renders activity feeds, but that indexer API isn't published in the SDK docs as of October 2026.

**To finish "total transactions" and "wallet age":** get the real endpoint paths (ask the Retium team, or inspect retium.net's network requests in a browser devtools), then fill them in at the two `TODO`s in [`src/explorer.js`](./src/explorer.js). Nothing else in the app needs to change — `server.js` already calls through those two functions and the frontend already renders `—` gracefully while they're null.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`, paste a `rete…` address, hit **Look up**.

## Project layout

```
server.js            Express server: static frontend + /api/activity/:address
src/retiumClient.js   Thin wrapper over the documented GET endpoints
src/address.js        Address format check (shape only, not full checksum)
src/holdings.js       Splits token holdings into NFTs vs fungible via RCP-1 metadata
src/explorer.js        Plug-in point for tx history / wallet age once you have an indexer API
public/                Frontend (vanilla HTML/CSS/JS, no build step)
```

## Notes

- Reads are open and rate-limited per address — no API key needed for anything in this repo.
- Address validation checks the `rete` + 68 hex-char shape only. Full checksum validation (recomputing the blake3 check bytes) needs a `blake3` npm package — see the TODO in `src/address.js` if you want that.
- NFT vs fungible-token classification is best-effort: it reads each held contract's RCP-1 `traits`, falling back to a `decimals === 0` heuristic if metadata lookup fails.

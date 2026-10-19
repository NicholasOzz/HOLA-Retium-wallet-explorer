// The documented RPC (docs.retium.org/developers/wire-reference.html) does
// NOT expose:
//   - a full transaction history for an address (sent + received)
//   - when an address was first seen on chain ("wallet age")
//
// `GET /api/wallet/{address}` only gives current balances and `nonce`
// (the account's next nonce — i.e. a proxy for *outgoing* tx count only).
//
// retium.net (the explorer) almost certainly has this data behind its own
// indexer API, since it renders per-wallet activity feeds. That API isn't
// published in the SDK docs as of this writing. Once you have real
// endpoint paths (ask the Retium team, or inspect retium.net's network
// requests), wire them in here — everything else in this repo calls
// through these two functions, so that's the only file that needs to change.

const EXPLORER_BASE = process.env.RETIUM_EXPLORER_BASE || null;

/**
 * Should resolve to a number (count of all txs touching this address) or null.
 * @param {string} _address
 * @returns {Promise<number|null>}
 */
async function getTotalTransactionCount(_address) {
  if (!EXPLORER_BASE) return null;

  // TODO: replace with the real indexer route once known, e.g.:
  // const res = await fetch(`${EXPLORER_BASE}/api/address/${_address}/tx-count`);
  // if (res.ok) return (await res.json()).count;
  return null;
}

/**
 * Should resolve to an ISO timestamp of the wallet's first on-chain
 * activity, or null if unknown.
 * @param {string} _address
 * @returns {Promise<string|null>}
 */
async function getFirstSeenAt(_address) {
  if (!EXPLORER_BASE) return null;

  // TODO: replace with the real indexer route once known, e.g.:
  // const res = await fetch(`${EXPLORER_BASE}/api/address/${_address}/first-seen`);
  // if (res.ok) return (await res.json()).first_seen_at;
  return null;
}

function daysSince(isoTimestamp) {
  if (!isoTimestamp) return null;
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return null;
  const ms = Date.now() - then;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

module.exports = { getTotalTransactionCount, getFirstSeenAt, daysSince };

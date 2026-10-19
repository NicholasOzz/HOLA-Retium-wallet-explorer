// Thin client for the documented Retium RPC reads.
// Source: https://docs.retium.org/developers/wire-reference.html
//
// Reads are open and need no API key. They ARE rate limited per address,
// so this file is the one place to add retry/backoff later if you need it.

const RPC_BASE = process.env.RETIUM_RPC_BASE || "https://rpc.retium.org";

class RetiumApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "RetiumApiError";
    this.status = status;
    this.body = body;
  }
}

async function getJson(path) {
  const url = `${RPC_BASE}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    // 404 on /api/wallet/{address} shouldn't normally happen — an unseen
    // account answers with zero balances per the docs — but handle it
    // defensively in case the chain state differs.
    throw new RetiumApiError(
      `Retium RPC ${path} responded ${res.status}`,
      res.status,
      body
    );
  }
  return body;
}

/** GET /api/wallet/{address} -> {address, balance_rtm, balance_pie, pending_incoming, nonce, ...} */
async function getWallet(address) {
  return getJson(`/api/wallet/${encodeURIComponent(address)}`);
}

/** GET /api/wallet/{address}/tokens -> {tokens: [{contract_id, name, symbol, decimals, balance}]} */
async function getWalletTokens(address) {
  return getJson(`/api/wallet/${encodeURIComponent(address)}/tokens`);
}

/** GET /api/contract/{id} -> {contract_id, deployer, code_hash, rcp_metadata, ...} (404 if none) */
async function getContract(contractId) {
  try {
    return await getJson(`/api/contract/${encodeURIComponent(contractId)}`);
  } catch (err) {
    if (err instanceof RetiumApiError && err.status === 404) return null;
    throw err;
  }
}

/** GET /health -> {status, tick, peers, version} */
async function getHealth() {
  return getJson("/health");
}

module.exports = {
  RPC_BASE,
  RetiumApiError,
  getWallet,
  getWalletTokens,
  getContract,
  getHealth,
};

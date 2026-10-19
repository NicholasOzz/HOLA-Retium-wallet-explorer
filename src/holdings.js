const { getContract } = require("./retiumClient");

// GET /api/wallet/{address}/tokens returns every token contract balance
// (fungible or not) with no explicit "is this an NFT" flag. RCP-1 contract
// metadata (docs.retium.org/developers/rcp-1.html) carries `traits`, e.g.
// ["fungible"] vs something else for non-fungible collections — so we
// cross-check each held contract's metadata to split the list.
//
// This does one extra RPC call per *distinct* contract the wallet holds
// (not per token), which is fine for a wallet holding a handful of
// collections. Results are cached in-process for the life of the server.

const metadataCache = new Map(); // contract_id -> rcp_metadata | null

async function getCachedMetadata(contractId) {
  if (metadataCache.has(contractId)) return metadataCache.get(contractId);
  const contract = await getContract(contractId);
  const meta = contract ? contract.rcp_metadata || null : null;
  metadataCache.set(contractId, meta);
  return meta;
}

function isNonFungible(meta) {
  if (!meta || !Array.isArray(meta.traits)) return false;
  return !meta.traits.includes("fungible");
}

/**
 * @param {Array<{contract_id:string,name:string,symbol:string,decimals:number,balance:string}>} tokens
 * @returns {Promise<{nfts: Array, fungibleTokens: Array}>}
 */
async function splitHoldings(tokens) {
  const nfts = [];
  const fungibleTokens = [];

  for (const token of tokens) {
    let meta = null;
    try {
      meta = await getCachedMetadata(token.contract_id);
    } catch {
      // If metadata lookup fails, fall back to a decimals=0 heuristic
      // rather than dropping the holding entirely.
    }

    const nonFungible = meta ? isNonFungible(meta) : Number(token.decimals) === 0;
    (nonFungible ? nfts : fungibleTokens).push({ ...token, rcp_metadata: meta });
  }

  return { nfts, fungibleTokens };
}

module.exports = { splitHoldings };

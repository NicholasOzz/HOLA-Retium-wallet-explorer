const path = require("path");
const express = require("express");

const { getWallet, getWalletTokens, RetiumApiError } = require("./src/retiumClient");
const { isWellFormedAddress } = require("./src/address");
const { splitHoldings } = require("./src/holdings");
const { getTotalTransactionCount, getFirstSeenAt, daysSince } = require("./src/explorer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/activity/:address", async (req, res) => {
  const { address } = req.params;

  if (!isWellFormedAddress(address)) {
    return res.status(400).json({
      error: "Not a well-formed Retium address (expected 'rete' + 68 hex characters).",
    });
  }

  try {
    const [wallet, tokensResp, totalTxCount, firstSeenAt] = await Promise.all([
      getWallet(address),
      getWalletTokens(address),
      getTotalTransactionCount(address),
      getFirstSeenAt(address),
    ]);

    const tokens = (tokensResp && tokensResp.tokens) || [];
    const { nfts, fungibleTokens } = await splitHoldings(tokens);

    res.json({
      address,
      balance: {
        rtm: wallet.balance_rtm,
        pie: wallet.balance_pie,
        pending_incoming: wallet.pending_incoming,
      },
      activity: {
        // Documented and reliable:
        outgoing_tx_count: wallet.nonce, // nonce == next nonce == count of txs this account has SENT
        // Best-effort, null until an indexer endpoint is wired in (see src/explorer.js):
        total_tx_count: totalTxCount,
        first_seen_at: firstSeenAt,
        wallet_age_days: daysSince(firstSeenAt),
      },
      holdings: {
        nft_count: nfts.length,
        nfts,
        fungible_tokens: fungibleTokens,
      },
    });
  } catch (err) {
    if (err instanceof RetiumApiError) {
      return res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
        error: err.message,
      });
    }
    console.error(err);
    res.status(500).json({ error: "Unexpected error looking up that address." });
  }
});

app.listen(PORT, () => {
  console.log(`Retium wallet explorer running at http://localhost:${PORT}`);
});

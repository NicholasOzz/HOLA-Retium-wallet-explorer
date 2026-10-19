const modeBtns = document.querySelectorAll(".mode-btn");
const addressInput = document.getElementById("address-input");
const addressTextarea = document.getElementById("address-textarea");
const checkBtn = document.getElementById("check-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

let mode = "one";

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    modeBtns.forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    addressInput.hidden = mode !== "one";
    addressTextarea.hidden = mode !== "multiple";
  });
});

checkBtn.addEventListener("click", async () => {
  const addresses =
    mode === "one"
      ? [addressInput.value.trim()].filter(Boolean)
      : addressTextarea.value
          .split(/[\n,]+/)
          .map((a) => a.trim())
          .filter(Boolean);

  if (!addresses.length) {
    setStatus("Enter at least one wallet address.", true);
    return;
  }

  checkBtn.disabled = true;
  resultEl.hidden = true;
  setStatus(
    addresses.length === 1
      ? "Looking up address…"
      : `Looking up ${addresses.length} addresses…`
  );

  try {
    const results = await Promise.all(
      addresses.map(async (address) => {
        try {
          const res = await fetch(`/api/activity/${encodeURIComponent(address)}`);
          const data = await res.json();
          return res.ok ? { ok: true, data } : { ok: false, address, error: data.error };
        } catch {
          return { ok: false, address, error: "Network error." };
        }
      })
    );

    setStatus("");
    render(results);
  } finally {
    checkBtn.disabled = false;
  }
});

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function render(results) {
  resultEl.innerHTML = results
    .map((r) => (r.ok ? renderWallet(r.data) : renderError(r.address, r.error)))
    .join("");
  resultEl.hidden = false;
}

function renderError(address, error) {
  return `
    <div class="card">
      <div class="address-block">${escapeHtml(address)}</div>
      <div class="note" style="color:#e0463a;">${escapeHtml(error || "Lookup failed.")}</div>
    </div>`;
}

function renderWallet(data) {
  const { address, balance, activity, holdings } = data;

  return `
    <div class="wallet-group">
      <div class="address-block">${escapeHtml(address)}</div>

      <div class="card">
        <h2>Balance</h2>
        <div class="stat-grid">
          <div class="stat">${escapeHtml(balance.rtm ?? "0")} <small>RTM</small></div>
          <div class="stat">${escapeHtml(balance.pending_incoming ?? "0")} <small>pending incoming</small></div>
        </div>
      </div>

      <div class="card">
        <h2>Activity</h2>
        <div class="stat-grid">
          <div class="stat">${activity.outgoing_tx_count}
            <small>transactions sent (on-chain nonce)</small>
          </div>
          <div class="stat">${formatMaybeUnavailable(activity.total_tx_count)}
            <small>total transactions (sent + received)</small>
          </div>
          <div class="stat">${formatMaybeUnavailable(activity.wallet_age_days, "days old")}
            <small>wallet age</small>
          </div>
        </div>
        ${
          activity.total_tx_count === null || activity.wallet_age_days === null
            ? `<div class="note">Total tx count and wallet age need an indexer endpoint not yet in the public RPC docs — see src/explorer.js.</div>`
            : ""
        }
      </div>

      <div class="card">
        <h2>NFT holdings (${holdings.nft_count})</h2>
        ${renderTokenRows(holdings.nfts)}
      </div>

      <div class="card">
        <h2>Other token holdings</h2>
        ${renderTokenRows(holdings.fungible_tokens)}
      </div>
    </div>`;
}

function renderTokenRows(tokens) {
  if (!tokens.length) return `<div class="note">None found.</div>`;
  return tokens
    .map(
      (t) => `
      <div class="token-row">
        <span>${escapeHtml(t.name || t.symbol || t.contract_id)}</span>
        <span>${escapeHtml(t.balance)}</span>
      </div>`
    )
    .join("");
}

function formatMaybeUnavailable(value, suffix = "") {
  if (value === null || value === undefined) return `<span class="unavailable">—</span>`;
  return suffix ? `${value} <small>${suffix}</small>` : String(value);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

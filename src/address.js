// Format check for Retium addresses, per docs.retium.org/developers/wire-reference.html:
//
//   H       = blake3(public key)                           32 bytes
//   C       = first 2 bytes of blake3("retium.addr.v1" + H)
//   address = "rete" + hex(H) + hex(C)                      72 chars, lowercase
//
// This checks shape only (prefix, length, hex charset) — it does NOT
// recompute the blake3 checksum, since that needs a blake3 library.
// TODO: if you want full checksum validation, add the `blake3` npm
// package and recompute C from the first 32 bytes, as the docs describe.

const ADDRESS_RE = /^rete[0-9a-f]{68}$/;

function isWellFormedAddress(address) {
  return typeof address === "string" && ADDRESS_RE.test(address);
}

module.exports = { isWellFormedAddress };

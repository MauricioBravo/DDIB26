#!/usr/bin/env python3
"""
Two ways to use it:

1) Passing the hash as an argument (doesn't touch this file):
   python3 greenproof_tx_lookup.py <TX_HASH>

2) For the demo: edit the DEFAULT_HASH value below, save,
   and run with no arguments:
   ./greenproof_tx_lookup.py
   (first time only, make it executable: chmod +x greenproof_tx_lookup.py)
"""
import sys
import urllib.request
import json
import datetime

API = "http://130.60.24.200:8080"

# <<< EDIT THIS HASH BEFORE EACH DEMO AND SAVE >>>
DEFAULT_HASH = "5e06f9f2a35ad711560699ad4c85d7c2cc4a24bdf4f5db01a5d881ec5340fa31"


def describe(utxo):
    is_script = bool(utxo.get("script_ref") or utxo.get("inline_datum") or utxo.get("reference_script_hash"))
    kind = "CONTRACT (script)" if is_script else "regular wallet"
    return utxo["address"], kind


def parse_msg(msg_list):
    """Looks for company:/actionType:/quantity:/vote: inside the CIP-20 message
    array. Older votes (before 2026-07-18) only had company:/decision: -- no
    actionType/quantity -- 'decision' is still read as a fallback for VOTE."""
    company = None
    action_type = None
    quantity = None
    vote = None
    for line in msg_list:
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip().lower()
            val = val.strip()
            if key == "company":
                company = val
            elif key == "actiontype":
                action_type = val
            elif key == "quantity":
                quantity = val
            elif key in ("vote", "decision"):
                vote = val
    action = " - ".join(p for p in (action_type, quantity) if p) or None
    return company, action, vote


def main():
    if len(sys.argv) == 2:
        tx_hash = sys.argv[1]
    elif len(sys.argv) == 1:
        entered = input(f"Enter TX hash [press Enter to use {DEFAULT_HASH[:12]}...]: ").strip()
        tx_hash = entered if entered else DEFAULT_HASH
    else:
        print("Usage: python3 greenproof_tx_lookup.py [TX_HASH]")
        sys.exit(1)

    tx = json.load(urllib.request.urlopen(f"{API}/api/v1/txs/{tx_hash}", timeout=8))
    meta = json.load(urllib.request.urlopen(f"{API}/api/v1/txs/{tx_hash}/metadata", timeout=8))

    when = "(no metadata, no timestamp)"
    company = action = vote = None
    metadata_raw = None

    if meta:
        when = datetime.datetime.utcfromtimestamp(meta[0]["block_time"]).strftime("%Y-%m-%d %H:%M:%S UTC")
        metadata_raw = meta[0]["json_metadata"]
        if isinstance(metadata_raw, dict) and "msg" in metadata_raw:
            company, action, vote = parse_msg(metadata_raw["msg"])

    # The wallet that originated/signed the tx is the first input
    wallet_address = tx["inputs"][0]["address"] if tx["inputs"] else "(not found)"

    print("=" * 60)
    print(f"YOUR WALLET:  {wallet_address}")
    print(f"TX HASH:      {tx_hash}")
    print(f"BLOCK:        {tx['block_height']}")
    print(f"SLOT:         {tx['slot']}")
    print(f"TIMESTAMP:    {when}")
    print(f"FEE:          {tx['fees']} lovelace")
    print("-" * 60)

    print("CONTRACT / ADDRESSES involved:")
    for label, utxos in (("input", tx["inputs"]), ("output", tx["outputs"])):
        for u in utxos:
            addr, kind = describe(u)
            print(f"  [{label}] {addr}")
            print(f"           -> {kind}")
    print("  (note: a contract has no human-readable 'name' on-chain,")
    print("   it's identified only by its address / script hash, shown above)")
    print("-" * 60)

    print(f"COMPANY:      {company or '(not found in metadata)'}")
    print(f"ACTION:       {action or '(not found in metadata)'}")
    print(f"VOTE:         {vote or '(not found in metadata)'}")
    print("-" * 60)
    print("FULL METADATA:")
    print(json.dumps(metadata_raw, indent=2, ensure_ascii=False) if metadata_raw else "(this tx has no metadata)")
    print("=" * 60)


if __name__ == "__main__":
    main()

"use client";

import { useState } from "react";
import type { RawChainQuery, RawOnChainRecord } from "@/lib/verify-onchain";
import { fetchRawChainRecord } from "../actions";

type Status = "idle" | "loading" | "done";

// Everything the indexer returned sits behind a solid accent rule, and
// everything this app says about it sits outside that rule. That boundary is
// the whole point of this control: a juror should be able to see, at a
// glance, which lines are ours and which came from a machine we do not run.
const PROVENANCE_RULE = "border-l-2 border-accent pl-4";

function StatusChip({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  const label = status === 0 ? "no response" : String(status);
  return (
    <span
      className={`shrink-0 border px-1.5 py-0.5 font-mono text-[11px] ${
        ok ? "border-primary text-primary" : "border-destructive text-destructive"
      }`}
    >
      {label}
    </span>
  );
}

function RequestRow({ query }: { query: RawChainQuery }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <a
        href={query.url}
        target="_blank"
        rel="noreferrer"
        className="break-all font-mono text-[11px] text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {query.url}
      </a>
      <StatusChip status={query.status} />
    </div>
  );
}

function ResponseBlock({ title, query }: { title: string; query: RawChainQuery }) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <pre className="mt-1 max-h-56 overflow-auto border border-border bg-card p-3 font-mono text-[11px] leading-relaxed text-foreground">
        {JSON.stringify(query.body, null, 2)}
      </pre>
    </div>
  );
}

export function VerifyOnChain({
  txHash,
  recordLabel,
}: {
  txHash: string;
  // What this transaction is, in the page's own words, e.g. "vote" or
  // "certification token". Used in the reading of the result so the copy
  // stays specific instead of saying "transaction" everywhere.
  recordLabel: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [record, setRecord] = useState<RawOnChainRecord | null>(null);

  async function runQuery() {
    setStatus("loading");
    setRecord(await fetchRawChainRecord(txHash));
    setStatus("done");
  }

  // The tx endpoint is what proves inclusion. The metadata endpoint answers
  // 200 with an empty array for a hash that does not exist at all, so its
  // status alone must never be read as confirmation of anything.
  const included = record ? record.tx.status === 200 : false;
  const metadataEntries = Array.isArray(record?.metadata.body)
    ? (record.metadata.body as unknown[]).length
    : null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={runQuery}
        disabled={status === "loading"}
        aria-expanded={status === "done"}
        className="border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
      >
        {status === "loading"
          ? "Querying the indexer..."
          : status === "done"
            ? "Query again"
            : "Verify on-chain"}
      </button>

      {status === "done" && record && (
        <div className={`mt-3 ${PROVENANCE_RULE}`}>
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
            Answered by the UZH Cardano indexer
          </p>
          <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
            This app did not produce the response below. It came from the
            network&apos;s own indexer, which we do not run. Open either
            address to get the same answer without going through this page.
          </p>

          <div className="mt-3 divide-y divide-border border-y border-border">
            <RequestRow query={record.tx} />
            <RequestRow query={record.metadata} />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-foreground">
            {included
              ? `The chain holds this ${recordLabel}.`
              : `The indexer has no record of this ${recordLabel} yet. On a freshly submitted transaction this is normal, it may still be propagating.`}
            {included && metadataEntries === 0
              ? " No metadata entries are attached to it."
              : ""}
          </p>

          <ResponseBlock title="Response, transaction" query={record.tx} />
          <ResponseBlock title="Response, metadata" query={record.metadata} />

          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Queried {new Date(record.queriedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

import { mintCertificationToken } from "@/lib/mint";

export type CaseStatus = "pending" | "certified" | "rejected";

export type VoteDecision = "approve" | "reject";

export type JurorVote = {
  jurorId: string;
  jurorLabel: string;
  decision: VoteDecision;
  simulated: boolean;
  castAt: string;
  comment?: string;
};

export type EvidenceFile = {
  url: string;
  type: "image" | "raw";
};

export type Evidence = {
  caption: string;
  // Optional -- seeded demo cases carry a real site location/capture date,
  // but a company filing straight from the web form (no site visit yet)
  // has neither, and a case's verifierEvidence starts as a placeholder
  // before any verifier has inspected it. See addCase's callers.
  location?: string;
  capturedAt?: string;
  // Additive -- existing seeded cases have no files, only the hardcoded
  // caption/location/capturedAt describing the evidence. Real uploads
  // (Cloudinary, resource_type "auto" so photos and documents share one
  // unsigned preset) attach here without touching the seed data shape.
  files?: EvidenceFile[];
};

export type MintStatus = "pending" | "minted" | "failed";

export type Case = {
  id: string;
  company: string;
  actionType: string;
  quantity: string;
  submittedAt: string;
  companyEvidence: Evidence;
  // verifierId is optional because verifier/jury rotation is a deliberate
  // PoC non-goal (docs/status.md Backend item 4) -- a company can file a
  // case before any verifier has been "assigned" to it, so a freshly
  // created case's verifierEvidence starts as a caption-only placeholder
  // with no verifierId/location/capturedAt yet.
  verifierEvidence: Evidence & { verifierId?: string };
  status: CaseStatus;
  votes: JurorVote[];
  mintStatus?: MintStatus;
  mintTxHash?: string;
  mintPolicyId?: string;
  mintError?: string;
};

export type NewCaseInput = Omit<Case, "id" | "submittedAt" | "status" | "votes">;

// Module-scope store: survives across requests within one running server
// process (fine for `next dev` / a single `next start`), resets on restart
// or redeploy. Deliberate stand-in for Firestore per docs/status.md.
const cases: Case[] = [
  {
    id: "case-006",
    company: "Patagonia",
    actionType: "Trees planted",
    quantity: "3,400 trees",
    submittedAt: "2026-07-17T09:12:00.000Z",
    companyEvidence: {
      caption: "Restoration crew photo, ridge line plot B",
      location: "39.6403 N, 106.3742 W",
      capturedAt: "2026-07-15",
    },
    verifierEvidence: {
      caption: "Independent site inspection, sample count of plot B",
      location: "39.6401 N, 106.3745 W",
      capturedAt: "2026-07-16",
      verifierId: "verifier-04",
    },
    status: "pending",
    votes: [],
  },
  {
    id: "case-005",
    company: "IKEA",
    actionType: "Trees planted",
    quantity: "12,000 trees",
    submittedAt: "2026-07-14T15:40:00.000Z",
    companyEvidence: {
      caption: "Aerial photo of reforestation block 7",
      location: "58.4108 N, 15.6214 E",
      capturedAt: "2026-07-12",
    },
    verifierEvidence: {
      caption: "Ground-truth inspection, block 7 sapling survival check",
      location: "58.4110 N, 15.6209 E",
      capturedAt: "2026-07-13",
      verifierId: "verifier-01",
    },
    status: "pending",
    votes: [],
  },
  {
    id: "case-004",
    company: "Maersk",
    actionType: "Trees planted",
    quantity: "850 trees",
    submittedAt: "2026-07-10T11:05:00.000Z",
    companyEvidence: {
      caption: "Port-side mangrove planting, phase 2",
      location: "1.2644 N, 103.8228 E",
      capturedAt: "2026-07-08",
    },
    verifierEvidence: {
      caption: "Mangrove sapling density verification",
      location: "1.2641 N, 103.8230 E",
      capturedAt: "2026-07-09",
      verifierId: "verifier-02",
    },
    status: "pending",
    votes: [],
  },
  {
    id: "case-003",
    company: "Siemens",
    actionType: "Trees planted",
    quantity: "5,100 trees",
    submittedAt: "2026-07-05T08:30:00.000Z",
    companyEvidence: {
      caption: "Employee volunteer planting day, industrial park buffer zone",
      location: "48.1372 N, 11.5756 E",
      capturedAt: "2026-07-03",
    },
    verifierEvidence: {
      caption: "Buffer zone sample plot verification",
      location: "48.1369 N, 11.5758 E",
      capturedAt: "2026-07-04",
      verifierId: "verifier-04",
    },
    status: "pending",
    votes: [],
  },
  {
    id: "case-002",
    company: "Unilever",
    actionType: "Trees planted",
    quantity: "2,200 trees",
    submittedAt: "2026-06-29T13:50:00.000Z",
    companyEvidence: {
      caption: "Watershed protection planting, upstream tea estate",
      location: "0.3476 N, 35.0038 E",
      capturedAt: "2026-06-27",
    },
    verifierEvidence: {
      caption: "Watershed plot inspection and GPS survey",
      location: "0.3479 N, 35.0035 E",
      capturedAt: "2026-06-28",
      verifierId: "verifier-03",
    },
    status: "pending",
    votes: [],
  },
  {
    id: "case-001",
    company: "Nestle",
    actionType: "Trees planted",
    quantity: "6,750 trees",
    submittedAt: "2026-06-20T10:15:00.000Z",
    companyEvidence: {
      caption: "Cocoa-belt agroforestry planting, season 1",
      location: "6.6019 N, 1.5757 E",
      capturedAt: "2026-06-18",
    },
    verifierEvidence: {
      caption: "Agroforestry plot inspection, season 1 sample",
      location: "6.6022 N, 1.5754 E",
      capturedAt: "2026-06-19",
      verifierId: "verifier-01",
    },
    status: "pending",
    votes: [],
  },
];

let nextCaseNumber = cases.length + 1;

export function listCases(): Case[] {
  return [...cases].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function getCase(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}

// Appends the verifier's own uploaded files (and an optional note) to a
// case's existing verifierEvidence -- doesn't overwrite the seeded
// caption/location/capturedAt, since those already describe a real
// inspection for the demo cases; this just attaches what was uploaded.
export function submitVerifierEvidence(
  caseId: string,
  input: { files: EvidenceFile[]; note?: string },
): Case {
  const target = cases.find((c) => c.id === caseId);
  if (!target) {
    throw new Error(`Unknown case: ${caseId}`);
  }
  target.verifierEvidence.files = [
    ...(target.verifierEvidence.files ?? []),
    ...input.files,
  ];
  if (input.note) {
    target.verifierEvidence.caption = input.note;
  }
  return target;
}

// Restarts the assessment for a rejected case: back to "pending", votes and
// mint state cleared, so it can go through jury review again. Evidence
// (company + verifier) is intentionally left untouched -- the company or
// verifier can add more evidence (via submitVerifierEvidence or the future
// company upload flow) before or after calling this, addressing whatever
// the rejection comments raised, per project-brief.md §5 ("returns with
// comments... can be resubmitted").
export function resubmitCase(caseId: string): Case {
  const target = cases.find((c) => c.id === caseId);
  if (!target) {
    throw new Error(`Unknown case: ${caseId}`);
  }
  if (target.status !== "rejected") {
    throw new Error(`Case ${caseId} isn't rejected, nothing to resubmit`);
  }
  target.status = "pending";
  target.votes = [];
  target.mintStatus = undefined;
  target.mintTxHash = undefined;
  target.mintPolicyId = undefined;
  target.mintError = undefined;
  return target;
}

export function addCase(input: NewCaseInput): Case {
  const created: Case = {
    ...input,
    id: `case-${String(nextCaseNumber).padStart(3, "0")}`,
    submittedAt: new Date().toISOString(),
    status: "pending",
    votes: [],
  };
  nextCaseNumber += 1;
  cases.push(created);
  return created;
}

export async function castVote(
  caseId: string,
  vote: Omit<JurorVote, "castAt">,
): Promise<Case> {
  const target = cases.find((c) => c.id === caseId);
  if (!target) {
    throw new Error(`Unknown case: ${caseId}`);
  }
  if (target.votes.length >= 3) {
    return target;
  }
  if (target.votes.some((v) => v.jurorId === vote.jurorId)) {
    throw new Error(`Juror ${vote.jurorId} already voted on ${caseId}`);
  }

  target.votes.push({ ...vote, castAt: new Date().toISOString() });

  const approvals = target.votes.filter((v) => v.decision === "approve").length;
  const rejections = target.votes.filter((v) => v.decision === "reject").length;
  const justCertified = approvals >= 2 && target.status === "pending";
  if (approvals >= 2) {
    target.status = "certified";
  } else if (rejections >= 2) {
    target.status = "rejected";
  }

  // Only fire the mint once, the moment the case first crosses 2-of-3 --
  // not on every subsequent vote call, and not for a case that was already
  // certified before this call (target.status check above).
  //
  // Deliberately NOT awaited here: a real mint takes several seconds
  // (network round-trips to build/sign/submit), and awaiting it would
  // block this Server Action's response for that whole time with no way
  // for the client to show progress in between -- the vote and the mint
  // result would both "jump" into view at once instead of the client
  // seeing a real "minting..." state. Firing it in the background and
  // letting the client poll getCase()/getCaseSnapshot for the update
  // works because this app runs as a persistent Node process (Docker on
  // Oracle Cloud, see docs/deploy.md), not a serverless function that
  // could be torn down before a detached promise finishes.
  if (justCertified) {
    target.mintStatus = "pending";
    const verifierId = target.verifierEvidence.verifierId ?? "unassigned";
    mintCertificationToken({
      caseId: target.id,
      company: target.company,
      actionType: target.actionType,
      quantity: target.quantity,
      verifierId,
    })
      .then((result) => {
        target.mintStatus = "minted";
        target.mintTxHash = result.txHash;
        target.mintPolicyId = result.policyId;
      })
      .catch((err) => {
        // The vote itself already succeeded (2-of-3 reached) -- a mint
        // failure shouldn't undo that. Same lesson as the vote-panel
        // tx-hash bug fixed earlier: a downstream failure must never hide
        // an upstream success.
        target.mintStatus = "failed";
        target.mintError = err instanceof Error ? err.message : "Unknown mint error";
      });
  }

  return target;
}

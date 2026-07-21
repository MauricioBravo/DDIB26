"use server";

import { revalidatePath } from "next/cache";
import { submitVerifierEvidence, type Case, type EvidenceFile } from "@/lib/cases";

export async function submitEvidence(
  caseId: string,
  files: EvidenceFile[],
  note?: string,
): Promise<Case> {
  const updated = submitVerifierEvidence(caseId, { files, note });
  revalidatePath("/verifier");
  revalidatePath(`/verifier/${caseId}`);
  revalidatePath(`/dao/${caseId}`);
  return updated;
}

"use server";

import { revalidatePath } from "next/cache";
import { addCase, type Case, type EvidenceFile } from "@/lib/cases";

export async function submitCompanyEvidence(input: {
  company: string;
  quantity: string;
  caption: string;
  files: EvidenceFile[];
}): Promise<Case> {
  const created = addCase({
    company: input.company,
    actionType: "Trees planted",
    quantity: input.quantity,
    companyEvidence: {
      caption: input.caption,
      files: input.files,
    },
    // No verifier has inspected this case yet -- rotation/assignment is a
    // deliberate PoC non-goal (docs/status.md Backend item 4), so this
    // starts as a caption-only placeholder rather than a fake assignment.
    verifierEvidence: {
      caption: "Awaiting verifier inspection.",
    },
  });

  revalidatePath("/dao");
  revalidatePath("/verifier");
  revalidatePath("/company/cases");
  return created;
}

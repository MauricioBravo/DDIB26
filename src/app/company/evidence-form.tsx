"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { EvidenceFile } from "@/lib/cases";
import { isCloudinaryConfigured, uploadEvidenceFile } from "@/lib/cloudinary";
import { submitCompanyEvidence } from "./actions";

type PickedFile = {
  file: File;
  previewUrl: string;
};

type SubmitStatus = "idle" | "uploading" | "done" | "error";

export function CompanyEvidenceForm() {
  const [company, setCompany] = useState("");
  const [quantity, setQuantity] = useState("");
  const [caption, setCaption] = useState("");
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudinaryReady = isCloudinaryConfigured();
  const quantityLabel = quantity.trim() ? `${quantity.trim()} trees` : "";
  const canSubmit =
    company.trim().length > 0 &&
    quantity.trim().length > 0 &&
    caption.trim().length > 0 &&
    picked.length > 0 &&
    status !== "uploading";

  function handleFilesPicked(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setPicked((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePicked(index: number) {
    setPicked((prev) => {
      const removed = prev[index];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("uploading");
    setErrorMessage(null);

    try {
      const uploaded: EvidenceFile[] = [];
      for (const { file } of picked) {
        uploaded.push(await uploadEvidenceFile(file));
      }
      const created = await submitCompanyEvidence({
        company: company.trim(),
        quantity: quantityLabel,
        caption: caption.trim(),
        files: uploaded,
      });
      picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setCaseId(created.id);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not file this case.",
      );
    }
  }

  if (status === "done" && caseId) {
    return (
      <div className="border border-primary bg-secondary p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          {caseId}
        </p>
        <h2 className="mt-2 font-heading text-2xl text-foreground">
          Case filed.
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          It now waits on an independent site visit, then a jury vote. Track
          its status from your case list.
        </p>
        <Link
          href="/company/cases"
          className="mt-6 inline-block border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
        >
          View your cases
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_1fr]">
      <div>
        <div>
          <label
            htmlFor="company"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Company name
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
            className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="quantity"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Trees planted
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1500"
            className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="caption"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Describe the planting
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Restoration crew photo, ridge line plot B"
            className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>

        {!cloudinaryReady && (
          <p className="mt-5 border border-dashed border-border p-4 text-sm text-muted-foreground">
            Photo and document upload isn&apos;t connected yet on this
            deployment.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* Same two-control split as the verifier's evidence form: a
              camera only ever produces a photo, so combining `capture`
              with a PDF accept type breaks document picking on some
              mobile browsers. */}
          <label
            className={`flex h-28 flex-col items-center justify-center gap-1 border-2 border-dashed border-border text-center transition-colors ${
              cloudinaryReady
                ? "cursor-pointer hover:border-primary hover:bg-secondary"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-widest text-foreground">
              Take a photo
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              jpg, png
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="environment"
              disabled={!cloudinaryReady}
              onChange={(e) => handleFilesPicked(e.target.files)}
              className="hidden"
            />
          </label>

          <label
            className={`flex h-28 flex-col items-center justify-center gap-1 border-2 border-dashed border-border text-center transition-colors ${
              cloudinaryReady
                ? "cursor-pointer hover:border-primary hover:bg-secondary"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-widest text-foreground">
              Choose files
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              photos or a pdf
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              multiple
              disabled={!cloudinaryReady}
              onChange={(e) => handleFilesPicked(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {picked.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {picked.map((p, i) => (
              <li key={i} className="relative">
                {p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.previewUrl}
                    alt={p.file.name}
                    className="h-20 w-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 items-center justify-center border border-border bg-secondary px-1 text-center font-mono text-[10px] text-muted-foreground">
                    {p.file.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePicked(i)}
                  aria-label="Remove file"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-muted-foreground hover:text-destructive"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-6 w-full border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "uploading" ? "Filing case..." : "Submit for review"}
        </button>

        {status === "error" && errorMessage && (
          <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      <div className="md:sticky md:top-8 md:self-start">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Preview
        </p>
        <div className="mt-3 border border-dashed border-border p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Exhibit A &middot; Company
          </p>
          {picked.length > 0 ? (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {picked.map((p, i) =>
                p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p.previewUrl}
                    alt={p.file.name}
                    className="h-16 w-full border border-border object-cover"
                  />
                ) : (
                  <div
                    key={i}
                    className="flex h-16 items-center justify-center border border-border bg-secondary font-mono text-xs text-muted-foreground"
                  >
                    Doc
                  </div>
                ),
              )}
            </ul>
          ) : (
            <div className="mt-3 flex h-20 items-center justify-center border border-border bg-secondary">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                No photos yet
              </span>
            </div>
          )}
          <p className="mt-3 text-sm text-foreground">
            {caption.trim() || "Your description will appear here."}
          </p>
          {(company.trim() || quantityLabel) && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {[company.trim(), quantityLabel].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This is exactly what a verifier and the DAO jury will see once
          this case is filed.
        </p>
      </div>
    </div>
  );
}

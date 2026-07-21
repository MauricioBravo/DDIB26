"use client";

import { useRef, useState } from "react";
import type { Case, EvidenceFile } from "@/lib/cases";
import { isCloudinaryConfigured, uploadEvidenceFile } from "@/lib/cloudinary";
import { submitEvidence } from "../actions";

type PickedFile = {
  file: File;
  previewUrl: string;
};

type SubmitStatus = "idle" | "uploading" | "done" | "error";

export function EvidenceForm({
  caseId,
  initialCase,
}: {
  caseId: string;
  initialCase: Case;
}) {
  const [caseData, setCaseData] = useState<Case>(initialCase);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudinaryReady = isCloudinaryConfigured();
  const alreadyAttached = caseData.verifierEvidence.files ?? [];

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
    if (picked.length === 0 && !note.trim()) return;
    setStatus("uploading");
    setErrorMessage(null);

    try {
      const uploaded: EvidenceFile[] = [];
      for (const { file } of picked) {
        uploaded.push(await uploadEvidenceFile(file));
      }
      const updated = await submitEvidence(caseId, uploaded, note.trim() || undefined);
      setCaseData(updated);
      picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPicked([]);
      setNote("");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not submit evidence.",
      );
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-foreground">
        Your inspection
      </p>

      {alreadyAttached.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {alreadyAttached.map((f, i) =>
            f.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={f.url}
                alt={`Attached evidence ${i + 1}`}
                className="h-20 w-full border border-border object-cover"
              />
            ) : (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 items-center justify-center border border-border bg-secondary font-mono text-xs text-muted-foreground"
              >
                Document
              </a>
            ),
          )}
        </div>
      )}

      {!cloudinaryReady && (
        <p className="mt-4 border border-dashed border-border p-4 text-sm text-muted-foreground">
          Photo and document upload isn&apos;t connected yet on this
          deployment. Once it is, this same screen will accept files
          directly.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* A camera only ever captures a photo, so this input stays
            image-only with `capture` -- combining capture with a PDF
            accept type is contradictory and breaks document picking on
            some mobile browsers, hence the separate control below. */}
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

      <div className="mt-5">
        <label
          htmlFor="note"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
        >
          Notes (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What did you observe on site?"
          className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          status === "uploading" || (picked.length === 0 && !note.trim())
        }
        className="mt-5 w-full border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "uploading" ? "Submitting..." : "Submit evidence"}
      </button>

      {status === "done" && (
        <p className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Evidence submitted.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

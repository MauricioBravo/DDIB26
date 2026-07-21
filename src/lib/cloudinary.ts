import type { EvidenceFile } from "@/lib/cases";

// Unsigned upload directly from the browser to Cloudinary -- no server
// round-trip, no secret involved (unsigned presets are meant to be public,
// scoped/restricted entirely on Cloudinary's side, not by hiding a key).
// "auto" resource type accepts both images and documents (e.g. PDF)
// through the same preset, so evidence uploads don't need to branch on
// file type -- see docs/status.md "Scope decision" (2026-07-20).
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadEvidenceFile(file: File): Promise<EvidenceFile> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary isn't configured yet (missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    url: data.secure_url as string,
    type: file.type === "application/pdf" ? "raw" : "image",
  };
}

import type { CompanyBadge } from "@/lib/companies";

// A laurel sprig for ranking badges -- literal olive branch, tying the
// Palette A "olive" token back to its namesake instead of just using it as
// an arbitrary accent color.
function OliveSprig({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 28 96"
      className={`h-24 w-7 text-olive ${mirrored ? "-scale-x-100" : ""}`}
      fill="none"
    >
      <path
        d="M14 4C14 4 12 40 14 92"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {[10, 24, 38, 52, 66, 80].map((y) => (
        <ellipse
          key={y}
          cx={y % 28 === 10 ? 20 : 8}
          cy={y}
          rx="6.5"
          ry="3.2"
          fill="currentColor"
          transform={`rotate(${y % 28 === 10 ? -28 : 28} ${y % 28 === 10 ? 20 : 8} ${y})`}
          opacity="0.85"
        />
      ))}
    </svg>
  );
}

export function MintedSeal({ badge }: { badge: CompanyBadge }) {
  const isRanking = badge.kind === "ranking";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center">
        {isRanking && <OliveSprig />}
        <div
          className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, var(--sand) 0%, var(--sand) 55%, #b3894f 100%)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -6px 10px rgba(43,43,43,0.3), 0 1px 2px rgba(43,43,43,0.15)",
          }}
        >
          <div className="absolute inset-[6px] rounded-full border border-charcoal/15" />
          <div className="flex flex-col items-center">
            <span className="font-heading text-2xl leading-none text-forest">
              {badge.value}
            </span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-forest/80">
              {badge.unit}
            </span>
          </div>
        </div>
        {isRanking && <OliveSprig mirrored />}
      </div>

      <p className="mt-4 max-w-[11rem] text-sm text-foreground">
        {badge.label}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        cert &middot; {badge.certRef}
      </p>
    </div>
  );
}

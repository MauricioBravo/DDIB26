import Link from "next/link";

// Laurel flanking the leader only. The same olive-branch device the profile
// page uses for ranking badges (see ../minted-seal.tsx) -- repeated here so a
// "top of the board" reads the same way in both places. Kept as a separate
// component rather than shared with MintedSeal because that one is shaped
// around a certification badge (value/unit/certRef), which a rank is not.
function OliveSprig({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 28 96"
      className={`h-20 w-6 text-olive ${mirrored ? "-scale-x-100" : ""}`}
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

export type RankSealProps = {
  rank: number;
  name: string;
  slug: string;
  displayValue: string;
  unit: string;
  meta: string;
  lead?: boolean;
};

export function RankSeal({
  rank,
  name,
  slug,
  displayValue,
  unit,
  meta,
  lead = false,
}: RankSealProps) {
  const diameter = lead ? "h-32 w-32" : "h-24 w-24";
  const valueSize = lead ? "text-3xl" : "text-2xl";

  return (
    <Link
      href={`/companies/${slug}`}
      className="group flex flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <div className="flex items-center justify-center">
        {lead && <OliveSprig />}
        <div
          className={`relative flex ${diameter} shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0`}
          style={{
            background:
              "radial-gradient(circle at 32% 28%, var(--sand) 0%, var(--sand) 55%, #b3894f 100%)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -6px 10px rgba(43,43,43,0.3), 0 1px 2px rgba(43,43,43,0.15)",
          }}
        >
          <div className="absolute inset-[6px] rounded-full border border-charcoal/15" />
          <div className="flex flex-col items-center">
            <span className={`font-heading ${valueSize} leading-none text-forest`}>
              {displayValue}
            </span>
            <span className="mt-1 max-w-[5.5rem] font-mono text-[9px] uppercase leading-tight tracking-widest text-forest/80">
              {unit}
            </span>
          </div>
        </div>
        {lead && <OliveSprig mirrored />}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Rank {String(rank).padStart(2, "0")}
      </p>
      <p className="mt-1 font-heading text-lg text-foreground group-hover:text-primary">
        {name}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {meta}
      </p>
    </Link>
  );
}

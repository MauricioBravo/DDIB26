import Link from "next/link";
import {
  CONTRIBUTION_TYPES,
  RANKING_BASES,
  SIZE_BRACKET_LABELS,
  getContributionType,
  listCategories,
  listCountries,
  rankCompanies,
  sizeBracketOf,
  unitFor,
  type ContributionTypeId,
  type RankingBasis,
  type RankingFilters,
  type SizeBracket,
} from "@/lib/companies";
import { RankSeal } from "./rank-seal";

// searchParams is a Promise in this Next version (see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md)
// -- it must be awaited, not read synchronously as in Next 14 and earlier.
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const SIZE_BRACKETS: SizeBracket[] = ["small", "medium", "large"];

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type Selection = {
  typeId: ContributionTypeId;
  basis: RankingBasis;
  filters: RankingFilters;
};

// Anything unrecognised in the URL is dropped rather than trusted, so a
// hand-edited query string can't reach getContributionType (which throws) or
// silently filter the board down to nothing.
function parseParams(raw: Awaited<SearchParams>): Selection {
  const typeParam = firstValue(raw.type);
  const typeId: ContributionTypeId = CONTRIBUTION_TYPES.some(
    (t) => t.id === typeParam,
  )
    ? (typeParam as ContributionTypeId)
    : "trees";

  const basisParam = firstValue(raw.basis);
  const basis: RankingBasis = RANKING_BASES.some((b) => b.id === basisParam)
    ? (basisParam as RankingBasis)
    : "total";

  const categoryParam = firstValue(raw.category);
  const countryParam = firstValue(raw.country);
  const sizeParam = firstValue(raw.size);

  return {
    typeId,
    basis,
    filters: {
      category: listCategories().includes(categoryParam ?? "")
        ? categoryParam
        : undefined,
      country: listCountries().includes(countryParam ?? "")
        ? countryParam
        : undefined,
      size: SIZE_BRACKETS.includes(sizeParam as SizeBracket)
        ? (sizeParam as SizeBracket)
        : undefined,
    },
  };
}

function buildHref(
  base: Selection,
  patch: Partial<{
    type: ContributionTypeId;
    basis: RankingBasis;
    category?: string;
    country?: string;
    size?: SizeBracket;
  }>,
) {
  const next = new URLSearchParams();

  const type = patch.type ?? base.typeId;
  const basis = patch.basis ?? base.basis;
  if (type !== "trees") next.set("type", type);
  if (basis !== "total") next.set("basis", basis);

  const category = "category" in patch ? patch.category : base.filters.category;
  const country = "country" in patch ? patch.country : base.filters.country;
  const size = "size" in patch ? patch.size : base.filters.size;

  if (category) next.set("category", category);
  if (country) next.set("country", country);
  if (size) next.set("size", size);

  const query = next.toString();
  return query ? `/companies/rankings?${query}` : "/companies/rankings";
}

function Chip({
  href,
  active,
  children,
  size = "sm",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const padding = size === "md" ? "px-4 py-2 text-xs" : "px-2.5 py-1 text-[11px]";
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`border font-mono uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${padding} ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterRow({
  label,
  options,
  active,
  hrefFor,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string | undefined;
  hrefFor: (value: string | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 py-3">
      <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <Chip href={hrefFor(undefined)} active={active === undefined}>
        Any
      </Chip>
      {options.map((option) => (
        <Chip
          key={option.value}
          href={hrefFor(option.value)}
          active={active === option.value}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

// How far this company sits from where the other basis would put it, within
// the same contribution type. Positive means this board flatters them.
function RankShift({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        className="w-12 text-right font-mono text-xs text-muted-foreground"
        title="Same position under either basis"
      >
        same
      </span>
    );
  }

  const better = delta > 0;
  const places = `${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"}`;
  return (
    <span
      className={`w-12 text-right font-mono text-xs ${better ? "text-olive" : "text-muted-foreground"}`}
      title={`${places} ${better ? "higher" : "lower"} here than under the other basis`}
    >
      {better ? "+" : "-"}
      {Math.abs(delta)}
    </span>
  );
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const selection = parseParams(raw);
  const { typeId, basis, filters } = selection;

  const type = getContributionType(typeId);
  const activeBasis = RANKING_BASES.find((b) => b.id === basis)!;
  const otherBasis = RANKING_BASES.find((b) => b.id !== basis)!;

  const ranked = rankCompanies(typeId, basis, filters);
  const comparison = rankCompanies(typeId, otherBasis.id, filters);
  const comparisonRanks = new Map(
    comparison.map((entry) => [entry.company.slug, entry.rank]),
  );

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const hasFilters = Boolean(
    filters.category || filters.country || filters.size,
  );
  const unit = unitFor(type, basis);

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link
          href="/"
          className="font-heading text-2xl tracking-tight text-primary"
        >
          GreenProof
        </Link>
        <Link
          href="/login"
          className="border border-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl border-t border-border px-6 sm:px-10">
        <section className="pt-6 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Public rankings
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl text-primary sm:text-4xl">
            Who leads depends on how you measure
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A shipping line cuts more carbon than a clothing label ever could,
            and a small firm can out-plant a global employer per head. Pick a
            certified action and a basis below; the board reorders. None of
            these readings is presented as the true one.
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
            Example data, not live certifications.
          </p>
        </section>

        <section className="border-t border-border pt-5 pb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Action
            </span>
            <div
              role="group"
              aria-label="Certified action"
              className="flex flex-wrap gap-2"
            >
              {CONTRIBUTION_TYPES.map((option) => (
                <Chip
                  key={option.id}
                  size="md"
                  href={buildHref(selection, { type: option.id })}
                  active={option.id === typeId}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Basis
            </span>
            <div
              role="group"
              aria-label="Ranking basis"
              className="flex flex-wrap gap-2"
            >
              {RANKING_BASES.map((option) => (
                <Chip
                  key={option.id}
                  size="md"
                  href={buildHref(selection, { basis: option.id })}
                  active={option.id === basis}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {type.blurb} {activeBasis.explainer}
          </p>
        </section>

        <section className="border-t border-border py-4">
          <FilterRow
            label="Sector"
            active={filters.category}
            options={listCategories().map((c) => ({ value: c, label: c }))}
            hrefFor={(value) => buildHref(selection, { category: value })}
          />
          <FilterRow
            label="Country"
            active={filters.country}
            options={listCountries().map((c) => ({ value: c, label: c }))}
            hrefFor={(value) => buildHref(selection, { country: value })}
          />
          <FilterRow
            label="Size"
            active={filters.size}
            options={SIZE_BRACKETS.map((b) => ({
              value: b,
              label: SIZE_BRACKET_LABELS[b],
            }))}
            hrefFor={(value) =>
              buildHref(selection, { size: value as SizeBracket | undefined })
            }
          />
          {hasFilters && (
            <p className="pt-1 font-mono text-[11px] uppercase tracking-widest">
              <Link
                href={buildHref(selection, {
                  category: undefined,
                  country: undefined,
                  size: undefined,
                })}
                className="text-primary underline underline-offset-4 hover:text-accent"
              >
                Clear filters
              </Link>
              <span className="ml-3 text-muted-foreground">
                {ranked.length} of 6 shown
              </span>
            </p>
          )}
        </section>

        {ranked.length === 0 ? (
          <section className="border-t border-border py-16 text-center">
            <p className="font-heading text-xl text-foreground">
              No companies match these filters
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear one of them to widen the board.
            </p>
          </section>
        ) : (
          <>
            <section className="border-t border-border py-10">
              <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:items-end sm:gap-14">
                {podium.map((entry, index) => (
                  <div
                    key={entry.company.slug}
                    className={
                      index === 0
                        ? "sm:order-2"
                        : index === 1
                          ? "sm:order-1"
                          : "sm:order-3"
                    }
                  >
                    <RankSeal
                      rank={entry.rank}
                      name={entry.company.name}
                      slug={entry.company.slug}
                      displayValue={entry.displayValue}
                      unit={unit}
                      meta={`${entry.company.country} · ${SIZE_BRACKET_LABELS[sizeBracketOf(entry.company)]}`}
                      lead={index === 0}
                    />
                  </div>
                ))}
              </div>
            </section>

            {rest.length > 0 && (
              <section className="pb-16">
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Remaining field
                  </h2>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Shift vs {otherBasis.label}
                  </p>
                </div>
                <ul className="divide-y divide-border border border-border border-t-0">
                  {rest.map((entry) => (
                    <li key={entry.company.slug}>
                      <Link
                        href={`/companies/${entry.company.slug}`}
                        className="group flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-secondary"
                      >
                        <div className="flex items-center gap-5">
                          <span className="font-mono text-sm text-muted-foreground">
                            {String(entry.rank).padStart(2, "0")}
                          </span>
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage font-heading text-sm text-forest">
                            {entry.company.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-heading text-lg text-foreground">
                              {entry.company.name}
                            </p>
                            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                              {entry.company.country} &middot;{" "}
                              {SIZE_BRACKET_LABELS[sizeBracketOf(entry.company)]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="text-right text-sm text-foreground">
                            {entry.displayValue}
                            <span className="ml-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                              {unit}
                            </span>
                          </p>
                          <RankShift
                            delta={
                              (comparisonRanks.get(entry.company.slug) ??
                                entry.rank) - entry.rank
                            }
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <section className="border-t border-border py-8">
          <Link
            href="/companies"
            className="font-mono text-xs uppercase tracking-widest text-primary hover:text-accent"
          >
            &larr; Full company directory
          </Link>
        </section>
      </main>
    </div>
  );
}

export type BadgeKind = "quantity" | "estimate" | "ranking";

export type CompanyBadge = {
  kind: BadgeKind;
  value: string;
  unit: string;
  label: string;
  certRef: string;
};

// Size brackets are derived from `employees`, never stored, so the two can
// never drift apart. Thresholds are arbitrary but fixed here so every ranking
// view groups companies the same way.
export type SizeBracket = "small" | "medium" | "large";

export const SIZE_BRACKET_THRESHOLDS = {
  small: 10_000,
  medium: 150_000,
} as const;

// The certified action categories a company can be ranked on. Each is a
// separate, independently measured achievement -- deliberately NOT derived
// from one another, so "most trees" and "most CO2 reduced" are genuinely
// different questions with different answers rather than the same league
// table in different units.
export type ContributionTypeId = "trees" | "co2" | "recycled";

export type CompanyProfile = {
  slug: string;
  name: string;
  country: string;
  category: string;
  tagline: string;
  headlineStat: string;
  // Sortable counterparts to the display strings in `badges`. The badge
  // values stay formatted for display ("12,000"); these stay numeric so
  // rankings can actually sort on them.
  contributions: Record<ContributionTypeId, number>;
  employees: number;
  badges: CompanyBadge[];
};

// Static, illustrative directory for the public no-auth "Companies" pages.
// Separate from the live in-memory DAO docket in cases.ts on purpose --
// these are example public-profile achievements for the PoC demo, not tied
// to whatever a juror happens to vote on case-by-case during a live demo.
// Same company names as cases.ts (real orgs, mock data) -- no logos or
// trademarks used, per the sanity-check note already established there.
export const companies: CompanyProfile[] = [
  {
    slug: "ikea",
    name: "IKEA",
    country: "Sweden",
    category: "Retail & manufacturing",
    tagline: "Reforestation across Nordic supply-chain buffer zones.",
    headlineStat: "12,000 trees certified",
    contributions: { trees: 12_000, co2: 9_800, recycled: 18_900 },
    employees: 231_000,
    badges: [
      {
        kind: "quantity",
        value: "12,000",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "7c1a2f9e...d403",
      },
      {
        kind: "estimate",
        value: "252",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "3e88b0d1...9a26",
      },
      {
        kind: "ranking",
        value: "1",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "f01c7d44...11ef",
      },
    ],
  },
  {
    slug: "nestle",
    name: "Nestle",
    country: "Switzerland",
    category: "Food & beverage",
    tagline: "Agroforestry planting across cocoa-belt sourcing regions.",
    headlineStat: "6,750 trees certified",
    contributions: { trees: 6_750, co2: 7_200, recycled: 11_500 },
    employees: 277_000,
    badges: [
      {
        kind: "quantity",
        value: "6,750",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "1a5f8c22...6b90",
      },
      {
        kind: "estimate",
        value: "142",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "9d02e7a4...c318",
      },
      {
        kind: "ranking",
        value: "2",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "44b1f09d...7e2a",
      },
    ],
  },
  {
    slug: "siemens",
    name: "Siemens",
    country: "Germany",
    category: "Industrial",
    tagline: "Employee-led planting along industrial buffer zones.",
    headlineStat: "5,100 trees certified",
    contributions: { trees: 5_100, co2: 31_500, recycled: 2_700 },
    employees: 312_000,
    badges: [
      {
        kind: "quantity",
        value: "5,100",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "6f3d9b11...a075",
      },
      {
        kind: "estimate",
        value: "107",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "b271e4c8...3f60",
      },
      {
        kind: "ranking",
        value: "3",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "0a9c5d76...e841",
      },
    ],
  },
  {
    slug: "patagonia",
    name: "Patagonia",
    country: "United States",
    category: "Apparel",
    tagline: "Ridge-line restoration plots in partnership with local crews.",
    headlineStat: "3,400 trees certified",
    contributions: { trees: 3_400, co2: 640, recycled: 4_150 },
    employees: 3_000,
    badges: [
      {
        kind: "quantity",
        value: "3,400",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "d84a1f30...5c9b",
      },
      {
        kind: "estimate",
        value: "71",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "2e6f80b5...41d7",
      },
      {
        kind: "ranking",
        value: "4",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "7b93c2a1...0f56",
      },
    ],
  },
  {
    slug: "unilever",
    name: "Unilever",
    country: "United Kingdom",
    category: "Consumer goods",
    tagline: "Watershed protection planting near upstream tea estates.",
    headlineStat: "2,200 trees certified",
    contributions: { trees: 2_200, co2: 12_400, recycled: 26_300 },
    employees: 128_000,
    badges: [
      {
        kind: "quantity",
        value: "2,200",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "5c0d9e2b...8a17",
      },
      {
        kind: "estimate",
        value: "46",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "e19a4f76...2d03",
      },
      {
        kind: "ranking",
        value: "5",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "8f42b0c9...d654",
      },
    ],
  },
  {
    slug: "maersk",
    name: "Maersk",
    country: "Denmark",
    category: "Logistics & shipping",
    tagline: "Port-side mangrove planting to stabilize coastal terminals.",
    headlineStat: "850 trees certified",
    contributions: { trees: 850, co2: 48_000, recycled: 1_900 },
    employees: 105_000,
    badges: [
      {
        kind: "quantity",
        value: "850",
        unit: "trees",
        label: "Trees certified to date",
        certRef: "a37cd150...9e42",
      },
      {
        kind: "estimate",
        value: "18",
        unit: "t CO2 / yr",
        label: "Estimated carbon offset",
        certRef: "c605f9a2...b378",
      },
      {
        kind: "ranking",
        value: "6",
        unit: "of 6",
        label: "GreenProof partners worldwide",
        certRef: "2d7e8b41...f0c9",
      },
    ],
  },
];

export function listCompanies(): CompanyProfile[] {
  return companies;
}

export function getCompany(slug: string): CompanyProfile | undefined {
  return companies.find((c) => c.slug === slug);
}

export function sizeBracketOf(company: CompanyProfile): SizeBracket {
  if (company.employees < SIZE_BRACKET_THRESHOLDS.small) return "small";
  if (company.employees < SIZE_BRACKET_THRESHOLDS.medium) return "medium";
  return "large";
}

export const SIZE_BRACKET_LABELS: Record<SizeBracket, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export type ContributionType = {
  id: ContributionTypeId;
  label: string;
  // Unit for raw totals, and for the size-adjusted view. Per 1,000 employees
  // rather than per employee: the per-employee figure is a fraction well
  // below 1 for every large company here, which reads as noise.
  unit: string;
  perStaffUnit: string;
  blurb: string;
};

// Registry, not a switch: a new certified action category means appending one
// entry here plus a key on CompanyProfile.contributions. Nothing in the
// ranking page enumerates these by hand.
export const CONTRIBUTION_TYPES: ContributionType[] = [
  {
    id: "trees",
    label: "Trees planted",
    unit: "trees",
    perStaffUnit: "trees / 1k staff",
    blurb: "Saplings certified in the ground.",
  },
  {
    id: "co2",
    label: "CO2 reduced",
    unit: "t CO2 / yr",
    perStaffUnit: "t CO2 / 1k staff",
    blurb: "Annual operational emissions cut, separate from tree offset.",
  },
  {
    id: "recycled",
    label: "Recycled material",
    unit: "t / yr",
    perStaffUnit: "t / 1k staff",
    blurb: "Material diverted from waste back into production.",
  },
];

export function getContributionType(id: ContributionTypeId): ContributionType {
  const type = CONTRIBUTION_TYPES.find((t) => t.id === id);
  if (!type) throw new Error(`Unknown contribution type: ${id}`);
  return type;
}

// Every contribution type can be read two ways. Keeping this a separate axis
// from the type means three categories give six leaderboards without six
// hand-written entries -- and it keeps the size-adjusted view sitting
// alongside the raw one rather than replacing it.
export type RankingBasis = "total" | "per-staff";

export const RANKING_BASES: {
  id: RankingBasis;
  label: string;
  explainer: string;
}[] = [
  {
    id: "total",
    label: "Raw total",
    explainer:
      "Certified totals as recorded. Favours large organisations, which have more resources to deploy.",
    },
  {
    id: "per-staff",
    label: "Per 1,000 staff",
    explainer:
      "Size-adjusted. 1,000 trees from a small firm is a larger commitment than the same number from a global employer, and this ranking reflects that.",
  },
];

export function valueFor(
  company: CompanyProfile,
  typeId: ContributionTypeId,
  basis: RankingBasis,
): number {
  const raw = company.contributions[typeId];
  return basis === "total" ? raw : raw / (company.employees / 1_000);
}

export function formatValue(value: number, basis: RankingBasis): string {
  return basis === "total"
    ? value.toLocaleString("en-US")
    : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function unitFor(
  type: ContributionType,
  basis: RankingBasis,
): string {
  return basis === "total" ? type.unit : type.perStaffUnit;
}

export type RankingFilters = {
  category?: string;
  country?: string;
  size?: SizeBracket;
};

export type RankedCompany = {
  rank: number;
  company: CompanyProfile;
  value: number;
  displayValue: string;
};

export function rankCompanies(
  typeId: ContributionTypeId,
  basis: RankingBasis,
  filters: RankingFilters = {},
): RankedCompany[] {
  const filtered = companies.filter((company) => {
    if (filters.category && company.category !== filters.category) return false;
    if (filters.country && company.country !== filters.country) return false;
    if (filters.size && sizeBracketOf(company) !== filters.size) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => valueFor(b, typeId, basis) - valueFor(a, typeId, basis),
  );

  // Standard competition ranking: equal values share a rank and the next
  // distinct value skips ahead (1, 2, 2, 4). Nothing ties in today's dataset,
  // but this stops a future data change from silently producing 1, 2, 3, 4
  // across companies that actually drew.
  let lastValue: number | null = null;
  let lastRank = 0;

  return sorted.map((company, index) => {
    const value = valueFor(company, typeId, basis);
    const rank = value === lastValue ? lastRank : index + 1;
    lastValue = value;
    lastRank = rank;

    return { rank, company, value, displayValue: formatValue(value, basis) };
  });
}

export function listCategories(): string[] {
  return [...new Set(companies.map((c) => c.category))].sort();
}

export function listCountries(): string[] {
  return [...new Set(companies.map((c) => c.country))].sort();
}

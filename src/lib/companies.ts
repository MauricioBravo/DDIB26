export type BadgeKind = "quantity" | "estimate" | "ranking";

export type CompanyBadge = {
  kind: BadgeKind;
  value: string;
  unit: string;
  label: string;
  certRef: string;
};

export type CompanyProfile = {
  slug: string;
  name: string;
  country: string;
  category: string;
  tagline: string;
  headlineStat: string;
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

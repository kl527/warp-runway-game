export interface WarpFeature {
  id: string;
  name: string;
  blurb: string;
}

// Real-ish Warp.co feature surface. Used as the "presents" an easter egg
// drops when the player walks over it. Keep blurbs short — they render as
// a single log line.
export const WARP_FEATURES: WarpFeature[] = [
  {
    id: "global_payroll",
    name: "Global Payroll",
    blurb: "Run payroll in every state and 100+ countries from one place.",
  },
  {
    id: "contractor_invoicing",
    name: "Contractor Invoicing",
    blurb: "Pay 1099s and international contractors without the spreadsheet dance.",
  },
  {
    id: "state_tax_reg",
    name: "State Tax Registrations",
    blurb: "Auto-register in every state the moment you hire there.",
  },
  {
    id: "equity_grants",
    name: "Equity Grants",
    blurb: "Issue option grants, track vesting, file 83(b)s with one click.",
  },
  {
    id: "i9_verification",
    name: "I-9 Verification",
    blurb: "E-Verify and I-9 completion without legal back-and-forth.",
  },
  {
    id: "eor",
    name: "International EOR",
    blurb: "Hire a senior in Lisbon by Tuesday, fully compliant.",
  },
  {
    id: "benefits_admin",
    name: "Benefits Admin",
    blurb: "Health, dental, vision, 401(k). You pick, Warp plumbs it.",
  },
  {
    id: "peo_setup",
    name: "PEO Setup",
    blurb: "Fortune-500-grade benefits from day one without the PEO lock-in.",
  },
  {
    id: "compliance_filings",
    name: "Compliance Filings",
    blurb: "Quarterly 941s, W-2s, 1099s, state filings — all handled.",
  },
  {
    id: "headcount_dashboards",
    name: "Headcount Dashboards",
    blurb: "Real numbers on burn, comp, and headcount trends.",
  },
  {
    id: "stock_option_plans",
    name: "Stock Option Plans",
    blurb: "409A valuations, plan amendments, exercise mechanics on autopilot.",
  },
  {
    id: "workers_comp",
    name: "Workers' Comp",
    blurb: "State-by-state workers' comp enrollment with no phone calls.",
  },
  {
    id: "expense_mgmt",
    name: "Expense Management",
    blurb: "Corporate cards, receipts, and reimbursements in one stack.",
  },
  {
    id: "pto_tracking",
    name: "PTO Tracking",
    blurb: "Accruals, holidays, parental leave — all auto-computed.",
  },
  {
    id: "ats_integration",
    name: "ATS Integration",
    blurb: "Close a candidate in Ashby, onboard in Warp, no copy-paste.",
  },
  {
    id: "commuter_benefits",
    name: "Commuter Benefits",
    blurb: "Pretax transit and parking without an HR intern.",
  },
  {
    id: "ai_hr_copilot",
    name: "AI HR Copilot",
    blurb: "'When does Jamie's visa expire?' answered in plain English.",
  },
  {
    id: "severance_kit",
    name: "Severance Kit",
    blurb: "Offboarding packets, final paychecks, COBRA — boxed up.",
  },
];

export function pickWarpFeature(rng: () => number): WarpFeature {
  const idx = Math.floor(rng() * WARP_FEATURES.length);
  return WARP_FEATURES[idx] ?? WARP_FEATURES[0];
}

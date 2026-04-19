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

// Reasons cited when an employee quits. Each one names a back-office failure
// Warp.co's product surface would have prevented — nudging the player toward
// the real pitch without breaking the game fiction.
export const WARP_QUIT_REASONS: string[] = [
  "payroll was late twice — Warp autopays",
  "state tax never got registered — Warp handles that on hire",
  "H-1B paperwork stalled for months — Warp runs immigration",
  "equity grant was never issued — Warp files 83(b)s in one click",
  "benefits enrollment lapsed — Warp plumbs health/dental/401(k)",
  "1099 was misfiled — Warp handles contractor compliance",
  "onboarding packet never arrived — Warp runs onboarding",
  "PTO accruals were wrong three months running — Warp auto-computes",
  "workers' comp wasn't enrolled in their state — Warp does that",
  "stock options were never documented — Warp tracks vesting",
  "commuter benefit never got set up — Warp does pretax transit",
  "severance terms were undocumented — Warp boxes up offboarding",
  "international wire bounced twice — Warp runs global payroll",
  "I-9 verification was missed — Warp E-Verifies",
  "409A was two years stale — Warp keeps valuations current",
  "HR kept losing their visa expiry — Warp's AI copilot tracks it",
  "COBRA paperwork never came — Warp handles offboarding",
  "expense reimbursements were 60 days late — Warp runs cards & receipts",
];

export function pickWarpQuitReason(seed: number): string {
  const idx = Math.abs(seed) % WARP_QUIT_REASONS.length;
  return WARP_QUIT_REASONS[idx];
}

export type LeaderboardRow = {
  handle: string;
  weeks_survived: number;
  peak_headcount: number;
  final_valuation: number;
  created_at: number;
};

export type LeaderboardListResponse = {
  rows: LeaderboardRow[];
};

export type LeaderboardSubmission = {
  handle: string;
  weeksSurvived: number;
  peakHeadcount: number;
  finalValuation: number;
};

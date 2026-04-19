CREATE INDEX IF NOT EXISTS leaderboard_peak_headcount_idx
  ON leaderboard (peak_headcount DESC, final_valuation DESC);

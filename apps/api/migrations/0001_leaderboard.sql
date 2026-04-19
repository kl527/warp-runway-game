CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL,
  weeks_survived INTEGER NOT NULL,
  peak_headcount INTEGER NOT NULL,
  final_valuation INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS leaderboard_weeks_idx
  ON leaderboard (weeks_survived DESC);

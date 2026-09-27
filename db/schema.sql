-- Forum database. Run with `npm run db:migrate`; every statement is safe to
-- run again.
--
-- One row per voter per statement. The statement id is the same in every
-- language (e.g. "t1-disclose"), so votes from all five languages count
-- toward one statement; `locale` records which language the vote came from.
-- `voter` is a SHA-256 hash of a random code kept in the voter's browser.
-- No name, email, or IP address is stored.
CREATE TABLE IF NOT EXISTS votes (
  statement_id TEXT NOT NULL,
  voter        CHAR(64) NOT NULL,
  vote         TEXT NOT NULL CHECK (vote IN ('agree', 'disagree', 'pass')),
  locale       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (statement_id, voter)
);

CREATE INDEX IF NOT EXISTS votes_voter ON votes (voter);

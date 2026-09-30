-- Forum database. Run with `npm run db:migrate`; every statement is safe to
-- run again.
--
-- One row per voter per statement. The statement id is the same in every
-- language (e.g. "t1-disclose"), so votes from every language count
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

-- Suggested statements. Each waits as 'pending' until Robert approves it;
-- a rejected suggestion is deleted, not kept. `ai_check` holds the
-- automated pre-check (flags plus an English translation for the reviewer),
-- or NULL when the check could not run.
CREATE TABLE IF NOT EXISTS submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 140),
  locale      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  ai_check    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS submissions_status_locale ON submissions (status, locale);

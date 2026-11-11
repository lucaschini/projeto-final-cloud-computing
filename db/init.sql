CREATE TABLE IF NOT EXISTS players (
    username   TEXT PRIMARY KEY,
    clicks     BIGINT NOT NULL DEFAULT 0,
    bananas    BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_players_bananas ON players (bananas DESC);

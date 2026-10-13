CREATE TABLE IF NOT EXISTS employees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  course_interest VARCHAR(160) NOT NULL,
  message TEXT,
  claimed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_claim_state CHECK ((claimed_by IS NULL) = (claimed_at IS NULL))
);

CREATE INDEX IF NOT EXISTS leads_public_created_idx ON leads (created_at DESC) WHERE claimed_by IS NULL;
CREATE INDEX IF NOT EXISTS leads_owner_created_idx ON leads (claimed_by, created_at DESC) WHERE claimed_by IS NOT NULL;

-- OnboardFlow Database Schema
-- Run via: cd backend && node src/db/migrate.js
-- Or manually: psql -U postgres -d onboardflow -f database/schema.sql

-- Users table (personal login credentials for new employees)
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        VARCHAR(255)  NOT NULL,
  email            VARCHAR(255)  UNIQUE NOT NULL,
  password_hash    VARCHAR(255),                 -- NULL for Google OAuth users
  auth_provider    VARCHAR(20)   DEFAULT 'email', -- 'email' or 'google'
  google_id        VARCHAR(255)  UNIQUE,          -- Google OAuth sub
  avatar_url       TEXT,
  employee_id      UUID,                          -- linked after onboarding
  is_onboarded     BOOLEAN       DEFAULT FALSE,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255)  NOT NULL,
  email            VARCHAR(255)  UNIQUE NOT NULL,
  work_email       VARCHAR(255)  UNIQUE,
  temporary_password VARCHAR(255),
  department       VARCHAR(100)  NOT NULL,
  role             VARCHAR(150)  NOT NULL,
  manager          VARCHAR(255)  NOT NULL,
  joining_date     DATE          NOT NULL,
  laptop_model     VARCHAR(100),
  office_location  VARCHAR(100),
  employee_id      VARCHAR(20)   UNIQUE,  -- assigned after initializeOnboarding()
  user_id          UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID;

-- Temporal workflow state
CREATE TABLE IF NOT EXISTS workflows (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID        REFERENCES employees(id) ON DELETE CASCADE,
  workflow_id       VARCHAR(255) UNIQUE NOT NULL,       -- Temporal workflow ID
  run_id            VARCHAR(255),                        -- Temporal run ID
  task_queue        VARCHAR(100) DEFAULT 'onboarding-queue',
  status            VARCHAR(50)  DEFAULT 'WAITING_SIGNAL',
  current_step      VARCHAR(100),
  current_step_index INTEGER     DEFAULT 0,
  started_at        TIMESTAMPTZ  DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- Per-activity tracking
CREATE TABLE IF NOT EXISTS workflow_activities (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID        REFERENCES workflows(id) ON DELETE CASCADE,
  activity_name  VARCHAR(100) NOT NULL,
  activity_index INTEGER      NOT NULL,
  status         VARCHAR(50)  DEFAULT 'PENDING',
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  retry_count    INTEGER      DEFAULT 0,
  error_message  TEXT,
  result         JSONB,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- Immutable audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID        REFERENCES employees(id) ON DELETE CASCADE,
  workflow_id  UUID        REFERENCES workflows(id)  ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  actor        VARCHAR(100),
  details      JSONB,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Manager directory (pre-seeded)
CREATE TABLE IF NOT EXISTS managers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  department   VARCHAR(100),
  role         VARCHAR(100),
  manager_type VARCHAR(50) DEFAULT 'DEPARTMENT_HEAD',  -- DEPARTMENT_HEAD, ROLE_HEAD, etc.
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE managers ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE managers ADD COLUMN IF NOT EXISTS role VARCHAR(100);
ALTER TABLE managers ADD COLUMN IF NOT EXISTS manager_type VARCHAR(50) DEFAULT 'DEPARTMENT_HEAD';
ALTER TABLE managers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Seed managers
INSERT INTO managers (name, email, department, role, manager_type) VALUES
  ('Rahul Sharma',  'sriharshanandiraju@gmail.com',  'Engineering', NULL, 'DEPARTMENT_HEAD'),
  ('Ananya Patel',  'sriharshanandiraju@gmail.com',  'Design', NULL, 'DEPARTMENT_HEAD'),
  ('Vikram Singh',  'sriharshanandiraju@gmail.com',  'Product', NULL, 'DEPARTMENT_HEAD'),
  ('Meera Nair',    'sriharshanandiraju@gmail.com',  'Marketing', NULL, 'DEPARTMENT_HEAD'),
  ('Arjun Reddy',   'sriharshanandiraju@gmail.com',  'Finance', NULL, 'DEPARTMENT_HEAD'),
  ('Priya Kapoor',  'sriharshanandiraju@gmail.com',  'Engineering', 'Senior Software Engineer', 'ROLE_HEAD'),
  ('Amit Desai',    'sriharshanandiraju@gmail.com',  'Engineering', 'DevOps Engineer', 'ROLE_HEAD'),
  ('Sanjay Kumar',  'sriharshanandiraju@gmail.com',  'Product', 'Product Manager', 'ROLE_HEAD'),
  ('Maya Singh',    'sriharshanandiraju@gmail.com',  'Design', 'UX Designer', 'ROLE_HEAD');

-- IT Team members
CREATE TABLE IF NOT EXISTS it_team (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  role         VARCHAR(100) DEFAULT 'IT_SUPPORT',
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE it_team ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'IT_SUPPORT';
ALTER TABLE it_team ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Seed IT team
INSERT INTO it_team (name, email, role) VALUES ('IT Support', 'harsha.ti.app@gmail.com', 'IT_LEAD')
ON CONFLICT (email) DO NOTHING;

-- Approval requests tracking
CREATE TABLE IF NOT EXISTS approval_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  workflow_id    UUID        REFERENCES workflows(id) ON DELETE CASCADE,
  approval_type  VARCHAR(50) NOT NULL,  -- MANAGER_APPROVAL, IT_APPROVAL, PAYROLL_APPROVAL
  approver_id    UUID,                  -- ID of manager or IT team member (can be NULL initially)
  approver_email VARCHAR(255),
  approver_name  VARCHAR(255),
  status         VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  reason         TEXT,
  requested_at   TIMESTAMPTZ  DEFAULT NOW(),
  responded_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver ON approval_requests(approver_email);
CREATE INDEX IF NOT EXISTS idx_approval_requests_employee ON approval_requests(employee_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;
DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER employees_updated_at  BEFORE UPDATE ON employees  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workflows_updated_at  BEFORE UPDATE ON workflows  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at     BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

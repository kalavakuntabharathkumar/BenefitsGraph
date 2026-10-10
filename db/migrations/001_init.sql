CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 full_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('EMPLOYEE','HR_ADMIN')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS benefit_plans (
 id SERIAL PRIMARY KEY, name TEXT NOT NULL, plan_type TEXT NOT NULL,
 annual_premium_cents INTEGER NOT NULL CHECK(annual_premium_cents >= 0),
 deductible_cents INTEGER NOT NULL CHECK(deductible_cents >= 0),
 copay_cents INTEGER NOT NULL CHECK(copay_cents >= 0), coverage_percent INTEGER NOT NULL CHECK(coverage_percent BETWEEN 0 AND 100), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS enrollments (
 id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), plan_id INTEGER NOT NULL REFERENCES benefit_plans(id),
 effective_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', UNIQUE(user_id,plan_id)
);
CREATE TABLE IF NOT EXISTS claims (
 id SERIAL PRIMARY KEY, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), description TEXT NOT NULL,
 service_date DATE NOT NULL, billed_cents INTEGER NOT NULL CHECK(billed_cents > 0), status TEXT NOT NULL DEFAULT 'SUBMITTED',
 submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), reviewed_by INTEGER REFERENCES users(id), reviewed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS claim_events (
 id SERIAL PRIMARY KEY, claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
 actor_id INTEGER NOT NULL REFERENCES users(id), event_type TEXT NOT NULL, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dependents (
 id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), full_name TEXT NOT NULL,
 relationship TEXT NOT NULL, date_of_birth DATE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_claims_enrollment ON claims(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);

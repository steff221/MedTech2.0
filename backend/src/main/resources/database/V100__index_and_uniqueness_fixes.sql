-- ============================================================================
-- V100: Index and uniqueness fixes aligned with the actual JPA query patterns.
--
-- All operations are additive and idempotent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- H2. Case-insensitive email uniqueness + login lookup.
--     UserRepository.findByEmailIgnoreCase renders `lower(email) = lower(?)`,
--     which the raw-column indexes (users_email_key, idx_users_email) cannot
--     serve. The existing UNIQUE(email) is case-sensitive, so two accounts
--     differing only in case could coexist and make case-insensitive login
--     ambiguous. A unique index on lower(email) fixes both at once.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));

-- ----------------------------------------------------------------------------
-- H3. Only foreign key in the schema with no covering index.
--     medical_record_events.authored_by -> users(id).
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mre_authored_by
    ON medical_record_events (authored_by);

-- ----------------------------------------------------------------------------
-- M1. Case-insensitive directory / search predicates.
--     DoctorRepository.search / findBySpecializationIgnoreCaseAndStatus filter
--     on lower(specialization) (+ status) and lower(hospital.city);
--     HospitalRepository.findByCityIgnoreCase filters on lower(city).
--     The plain-column indexes cannot be used for those lowercased predicates.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctors_lower_spec_status
    ON doctors (lower(specialization), status);

CREATE INDEX IF NOT EXISTS idx_hospitals_lower_city
    ON hospitals (lower(city));

ANALYZE users;
ANALYZE doctors;
ANALYZE hospitals;
ANALYZE medical_record_events;

-- Report numbers were derived from the generated primary key, which forced a
-- save-then-update: the first INSERT wrote NULL into the NOT NULL
-- report_number column and failed, so report generation was unusable.
--
-- A dedicated sequence lets the number be built before the insert, mirroring
-- referral_number_seq (V18). Two doctors generating a report for the same
-- period now get distinct numbers, which the UNIQUE constraint requires.
CREATE SEQUENCE IF NOT EXISTS doctor_report_number_seq START WITH 1 INCREMENT BY 1;

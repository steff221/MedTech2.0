-- Add VIRTUAL appointment type and video call URL column
ALTER TYPE appointment_type_enum ADD VALUE IF NOT EXISTS 'VIRTUAL';

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS video_call_url VARCHAR(2048);

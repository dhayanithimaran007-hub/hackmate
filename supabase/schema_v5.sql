-- HACKMATE SQL MIGRATION (schema_v5.sql)
-- Add location fields to hackathons table

ALTER TABLE hackathons 
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Tamil Nadu',
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS hosting_college TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS venue TEXT;

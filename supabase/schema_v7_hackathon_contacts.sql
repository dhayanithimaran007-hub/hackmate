-- HACKMATE SQL MIGRATION (schema_v7_hackathon_contacts.sql)
-- Add contact fields to hackathons table

ALTER TABLE hackathons 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

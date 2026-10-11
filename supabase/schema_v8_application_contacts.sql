-- HACKMATE SQL MIGRATION (schema_v8_application_contacts.sql)
-- Add contact fields to applications table

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

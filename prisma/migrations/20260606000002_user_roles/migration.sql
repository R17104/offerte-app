-- Create UserRole enum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add role column to User (defaults to SALES for existing users)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'SALES';

-- Set admin@offerte.app to ADMIN
UPDATE "User" SET "role" = 'ADMIN' WHERE email = 'admin@offerte.app';

-- Tip: om andere gebruikers admin te maken, run:
-- UPDATE "User" SET "role" = 'ADMIN' WHERE email = 'jouw-email@offerte.app';

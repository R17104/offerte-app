-- Migrate legacy enum values to new equivalents
UPDATE "Lead" SET status = 'AFSPRAAK_INGEPLAND' WHERE status = 'INTERESTED';
UPDATE "Lead" SET status = 'BETALING_100'       WHERE status = 'WON';

-- Track who planned the appointment (for planner/closer system)
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "appointmentPlannedById" TEXT REFERENCES "User"(id) ON DELETE SET NULL;

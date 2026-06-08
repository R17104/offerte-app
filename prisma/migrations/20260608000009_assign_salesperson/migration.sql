-- Add assignedToId to Quote and Lead for salesperson assignment
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT REFERENCES "User"(id) ON DELETE SET NULL;
ALTER TABLE "Lead"  ADD COLUMN IF NOT EXISTS "assignedToId" TEXT REFERENCES "User"(id) ON DELETE SET NULL;

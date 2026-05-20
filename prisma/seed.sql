-- ============================================================
-- Seed: gebruikers aanmaken + bestaande data koppelen aan admin
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Gebruikers aanmaken
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'thijmen@offerte.app', '$2b$10$PFELNEXVuvVNAhFNBq3Xme3NTZZSe5eYYDBy8ss5zqES3KxnzUCMS', 'Thijmen', now(), now()),
  (gen_random_uuid()::text, 'repke@offerte.app',   '$2b$10$4LAirrCb9.m3t6jo2saBseuUA4F8oN7YhSkkQkDOSuV3cIDrdNZUu', 'Repke',   now(), now()),
  (gen_random_uuid()::text, 'admin@offerte.app',   '$2b$10$qMtLB2WQFCPSqAhp2s6acOuoYNN.nHAmBv8XpMOpBEXD31fIW/38y', 'Admin',   now(), now())
ON CONFLICT (email) DO NOTHING;

-- 2. Bestaande quotes, klanten en producten koppelen aan admin
UPDATE "Quote"
SET "createdById" = (SELECT id FROM "User" WHERE email = 'admin@offerte.app')
WHERE "createdById" NOT IN (SELECT id FROM "User" WHERE email != 'system@placeholder.local');

UPDATE "Customer"
SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@offerte.app')
WHERE "userId" IS NULL;

UPDATE "Product"
SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@offerte.app')
WHERE "userId" IS NULL;

-- 3. Eventuele systeem-placeholder gebruiker opruimen (optioneel)
-- DELETE FROM "User" WHERE email = 'system@placeholder.local';

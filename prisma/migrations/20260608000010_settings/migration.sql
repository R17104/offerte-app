CREATE TABLE IF NOT EXISTS "Setting" (
  "key"       TEXT PRIMARY KEY,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Standaard registratiecode
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('registration_code', '1234', NOW())
ON CONFLICT ("key") DO NOTHING;

-- Thijmen ADMIN maken
UPDATE "User" SET "role" = 'ADMIN' WHERE email = 'thijmen@offerte.app';

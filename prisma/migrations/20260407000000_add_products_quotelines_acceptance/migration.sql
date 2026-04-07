-- Drop old price column
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "price";

-- Add new Quote columns
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "subtotal"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "vatTotal"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sentAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acceptedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt"     TIMESTAMP(3);

-- Add publicToken as nullable first, populate, then constrain
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "publicToken" TEXT;
UPDATE "Quote" SET "publicToken" = gen_random_uuid()::TEXT WHERE "publicToken" IS NULL;
ALTER TABLE "Quote" ALTER COLUMN "publicToken" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Quote_publicToken_key" ON "Quote"("publicToken");

-- Create Product table
CREATE TABLE IF NOT EXISTS "Product" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "defaultQty"  DOUBLE PRECISION,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "vatRate"     DOUBLE PRECISION NOT NULL DEFAULT 21,
  "imageUrl"    TEXT,
  "notes"       TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Create QuoteLine table
CREATE TABLE IF NOT EXISTS "QuoteLine" (
  "id"          TEXT NOT NULL,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "quantity"    DOUBLE PRECISION NOT NULL,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "vatRate"     DOUBLE PRECISION NOT NULL,
  "lineTotal"   DOUBLE PRECISION NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quoteId"     TEXT NOT NULL,
  "productId"   TEXT,
  CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- Create QuoteAcceptance table
CREATE TABLE IF NOT EXISTS "QuoteAcceptance" (
  "id"            TEXT NOT NULL,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "dateOfBirth"   TIMESTAMP(3) NOT NULL,
  "iban"          TEXT,
  "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
  "signatureData" TEXT NOT NULL,
  "acceptedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress"     TEXT,
  "quoteId"       TEXT NOT NULL,
  CONSTRAINT "QuoteAcceptance_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "QuoteLine"
  ADD CONSTRAINT "QuoteLine_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "QuoteLine_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuoteAcceptance"
  ADD CONSTRAINT "QuoteAcceptance_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Unique constraint on QuoteAcceptance.quoteId
CREATE UNIQUE INDEX IF NOT EXISTS "QuoteAcceptance_quoteId_key" ON "QuoteAcceptance"("quoteId");

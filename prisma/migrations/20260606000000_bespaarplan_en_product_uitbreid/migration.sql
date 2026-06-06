-- ============================================================
-- Migration: Bespaarplan + Product uitbreidingen
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Nieuwe enums aanmaken
DO $$ BEGIN
  CREATE TYPE "ProductCategory" AS ENUM ('BATTERY', 'SOLAR', 'HEAT_PUMP', 'CHARGER', 'EMERGENCY_POWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteType" AS ENUM ('EIGEN_INVESTERING', 'GEFINANCIERD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancingType" AS ENUM ('WARMTEFONDS', 'SVN', 'BANK', 'OVERIG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "HouseType" AS ENUM ('TERRACED', 'CORNER', 'DETACHED', 'APARTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Product — nieuwe kolommen
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "category"           "ProductCategory",
  ADD COLUMN IF NOT EXISTS "capacityKwh"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "powerKw"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "warrantyYears"      INTEGER,
  ADD COLUMN IF NOT EXISTS "savingsKwhYear"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "gasReductionM3Year" DOUBLE PRECISION;

-- 3. Quote — offerteype + financiering
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "quoteType"       "QuoteType" NOT NULL DEFAULT 'EIGEN_INVESTERING',
  ADD COLUMN IF NOT EXISTS "financingType"   "FinancingType",
  ADD COLUMN IF NOT EXISTS "loanInterestRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
  ADD COLUMN IF NOT EXISTS "loanTermYears"   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "subsidyAmount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hasBtwReturn"    BOOLEAN NOT NULL DEFAULT false;

-- 4. Quote — energieprofiel klant
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "hasSolarPanels"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "solarProductionKwh"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "electricityUsageKwh"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "electricityFeedbackKwh" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "gasUsageM3"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "electricityTariff"      DOUBLE PRECISION NOT NULL DEFAULT 0.28,
  ADD COLUMN IF NOT EXISTS "feedbackTariff"         DOUBLE PRECISION NOT NULL DEFAULT 0.07,
  ADD COLUMN IF NOT EXISTS "gasTariff"              DOUBLE PRECISION NOT NULL DEFAULT 1.10,
  ADD COLUMN IF NOT EXISTS "numPersons"             INTEGER,
  ADD COLUMN IF NOT EXISTS "houseType"              "HouseType",
  ADD COLUMN IF NOT EXISTS "buildYear"              INTEGER,
  ADD COLUMN IF NOT EXISTS "houseSizeSqm"           INTEGER;

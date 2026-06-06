CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'QUOTE_SENT', 'WON', 'LOST');

CREATE TABLE "Lead" (
    "id"          TEXT NOT NULL,
    "firstName"   TEXT NOT NULL,
    "lastName"    TEXT NOT NULL,
    "email"       TEXT,
    "phone"       TEXT,
    "street"      TEXT,
    "houseNumber" TEXT,
    "postalCode"  TEXT,
    "city"        TEXT,
    "status"      "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source"      TEXT,
    "archivedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadNote" (
    "id"        TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId"    TEXT NOT NULL,
    "authorId"  TEXT NOT NULL,
    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead"     ADD CONSTRAINT "Lead_createdById_fkey"     FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey"      FOREIGN KEY ("leadId")     REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey"    FOREIGN KEY ("authorId")   REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

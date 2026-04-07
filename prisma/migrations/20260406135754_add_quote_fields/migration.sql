/*
  Warnings:

  - Added the required column `price` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

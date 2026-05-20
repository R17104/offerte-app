-- AlterTable: add password to User
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- AlterTable: add userId to Customer
ALTER TABLE "Customer" ADD COLUMN "userId" TEXT;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add userId to Product
ALTER TABLE "Product" ADD COLUMN "userId" TEXT;
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

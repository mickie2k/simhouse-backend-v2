/*
  Warnings:

  - A unique constraint covering the columns `[GoogleID]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[GoogleID]` on the table `host` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "booking" ALTER COLUMN "StatusID" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "GoogleID" VARCHAR(255);

-- AlterTable
ALTER TABLE "host" ADD COLUMN     "GoogleID" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "customer_GoogleID_key" ON "customer"("GoogleID");

-- CreateIndex
CREATE UNIQUE INDEX "host_GoogleID_key" ON "host"("GoogleID");

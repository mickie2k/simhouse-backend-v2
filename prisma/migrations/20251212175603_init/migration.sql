/*
  Warnings:

  - A unique constraint covering the columns `[CEmail]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[HEmail]` on the table `host` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `CEmail` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HEmail` to the `host` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "CEmail" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "host" ADD COLUMN     "HEmail" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customer_CEmail_key" ON "customer"("CEmail");

-- CreateIndex
CREATE UNIQUE INDEX "host_HEmail_key" ON "host"("HEmail");

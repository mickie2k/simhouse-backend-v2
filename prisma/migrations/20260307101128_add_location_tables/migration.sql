/*
  Warnings:

  - Added the required column `CityID` to the `simulatorlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "simulatorlist" ADD COLUMN     "CityID" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "country" (
    "CountryID" SERIAL NOT NULL,
    "CountryName" VARCHAR(100) NOT NULL,
    "CountryCode" VARCHAR(2) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("CountryID")
);

-- CreateTable
CREATE TABLE "province" (
    "ProvinceID" SERIAL NOT NULL,
    "ProvinceName" VARCHAR(100) NOT NULL,
    "CountryID" INTEGER NOT NULL,

    CONSTRAINT "province_pkey" PRIMARY KEY ("ProvinceID")
);

-- CreateTable
CREATE TABLE "city" (
    "CityID" SERIAL NOT NULL,
    "CityName" VARCHAR(100) NOT NULL,
    "ProvinceID" INTEGER,
    "CountryID" INTEGER NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("CityID")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_CountryName_key" ON "country"("CountryName");

-- CreateIndex
CREATE UNIQUE INDEX "country_CountryCode_key" ON "country"("CountryCode");

-- CreateIndex
CREATE UNIQUE INDEX "province_ProvinceName_CountryID_key" ON "province"("ProvinceName", "CountryID");

-- CreateIndex
CREATE UNIQUE INDEX "city_CityName_CountryID_ProvinceID_key" ON "city"("CityName", "CountryID", "ProvinceID");

-- AddForeignKey
ALTER TABLE "province" ADD CONSTRAINT "province_CountryID_fkey" FOREIGN KEY ("CountryID") REFERENCES "country"("CountryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_ProvinceID_fkey" FOREIGN KEY ("ProvinceID") REFERENCES "province"("ProvinceID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_CountryID_fkey" FOREIGN KEY ("CountryID") REFERENCES "country"("CountryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_CityID_fkey" FOREIGN KEY ("CityID") REFERENCES "city"("CityID") ON DELETE RESTRICT ON UPDATE CASCADE;

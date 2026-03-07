-- DropIndex
DROP INDEX "city_CityName_CountryID_ProvinceID_key";

-- DropIndex
DROP INDEX "province_ProvinceName_CountryID_key";

-- AlterTable
ALTER TABLE "province" ADD COLUMN     "ProvinceCode" VARCHAR(10);

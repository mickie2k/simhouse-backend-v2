-- AlterTable
ALTER TABLE "city" ALTER COLUMN "CityID" DROP DEFAULT;
DROP SEQUENCE "city_CityID_seq";

-- AlterTable
ALTER TABLE "country" ALTER COLUMN "CountryID" DROP DEFAULT;
DROP SEQUENCE "country_CountryID_seq";

-- AlterTable
ALTER TABLE "province" ALTER COLUMN "ProvinceID" DROP DEFAULT;
DROP SEQUENCE "province_ProvinceID_seq";

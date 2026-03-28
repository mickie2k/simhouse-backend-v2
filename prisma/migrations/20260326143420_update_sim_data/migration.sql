-- AlterTable
ALTER TABLE "simulatorlist" ADD COLUMN     "PedalID" INTEGER,
ADD COLUMN     "PlatformID" INTEGER,
ADD COLUMN     "ScreenSetupID" INTEGER,
ADD COLUMN     "WheelBaseModel" VARCHAR(100);

-- CreateTable
CREATE TABLE "pedalmodel" (
    "PedalID" SERIAL NOT NULL,
    "ModelName" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "BrandID" INTEGER NOT NULL,

    CONSTRAINT "pedalmodel_pkey" PRIMARY KEY ("PedalID")
);

-- CreateTable
CREATE TABLE "platform" (
    "PlatformID" SERIAL NOT NULL,
    "Name" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(200),

    CONSTRAINT "platform_pkey" PRIMARY KEY ("PlatformID")
);

-- CreateTable
CREATE TABLE "screensetup" (
    "ScreenSetupID" SERIAL NOT NULL,
    "Name" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(200),

    CONSTRAINT "screensetup_pkey" PRIMARY KEY ("ScreenSetupID")
);

-- AddForeignKey
ALTER TABLE "pedalmodel" ADD CONSTRAINT "pedalmodel_BrandID_fkey" FOREIGN KEY ("BrandID") REFERENCES "simulatorbrand"("BrandID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_PlatformID_fkey" FOREIGN KEY ("PlatformID") REFERENCES "platform"("PlatformID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_PedalID_fkey" FOREIGN KEY ("PedalID") REFERENCES "pedalmodel"("PedalID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_ScreenSetupID_fkey" FOREIGN KEY ("ScreenSetupID") REFERENCES "screensetup"("ScreenSetupID") ON DELETE SET NULL ON UPDATE CASCADE;

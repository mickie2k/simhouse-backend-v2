/*
  Warnings:

  - A unique constraint covering the columns `[SimID,Date,StartTime]` on the table `simulatorschedule` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "simulatorschedule" ADD COLUMN     "TemplateID" INTEGER;

-- CreateTable
CREATE TABLE "scheduletemplate" (
    "TemplateID" SERIAL NOT NULL,
    "DayOfWeek" SMALLINT NOT NULL,
    "StartTime" TIME(0) NOT NULL,
    "EndTime" TIME(0) NOT NULL,
    "PricePerHour" DECIMAL(10,2) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "SimID" INTEGER NOT NULL,

    CONSTRAINT "scheduletemplate_pkey" PRIMARY KEY ("TemplateID")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduletemplate_SimID_DayOfWeek_StartTime_EndTime_key" ON "scheduletemplate"("SimID", "DayOfWeek", "StartTime", "EndTime");

-- CreateIndex
CREATE INDEX "simulatorschedule_SimID_Date_Available_idx" ON "simulatorschedule"("SimID", "Date", "Available");

-- CreateIndex
CREATE INDEX "simulatorschedule_Date_Available_StartTime_idx" ON "simulatorschedule"("Date", "Available", "StartTime");

-- CreateIndex
CREATE UNIQUE INDEX "simulatorschedule_SimID_Date_StartTime_key" ON "simulatorschedule"("SimID", "Date", "StartTime");

-- AddForeignKey
ALTER TABLE "scheduletemplate" ADD CONSTRAINT "scheduletemplate_SimID_fkey" FOREIGN KEY ("SimID") REFERENCES "simulatorlist"("SimID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorschedule" ADD CONSTRAINT "simulatorschedule_TemplateID_fkey" FOREIGN KEY ("TemplateID") REFERENCES "scheduletemplate"("TemplateID") ON DELETE SET NULL ON UPDATE CASCADE;

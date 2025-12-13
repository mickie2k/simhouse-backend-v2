-- CreateTable
CREATE TABLE "customer" (
    "CustomerID" SERIAL NOT NULL,
    "FName" VARCHAR(100) NOT NULL,
    "LName" VARCHAR(100) NOT NULL,
    "Username" VARCHAR(100) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "CTel" VARCHAR(10),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("CustomerID")
);

-- CreateTable
CREATE TABLE "host" (
    "HostID" SERIAL NOT NULL,
    "FName" VARCHAR(100) NOT NULL,
    "LName" VARCHAR(100) NOT NULL,
    "Username" VARCHAR(100) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "Htel" VARCHAR(10) NOT NULL,

    CONSTRAINT "host_pkey" PRIMARY KEY ("HostID")
);

-- CreateTable
CREATE TABLE "simulatortype" (
    "SimTypeID" SERIAL NOT NULL,
    "SimTypeName" VARCHAR(32) NOT NULL,

    CONSTRAINT "simulatortype_pkey" PRIMARY KEY ("SimTypeID")
);

-- CreateTable
CREATE TABLE "simulatortypelist" (
    "SimTypeID" INTEGER NOT NULL,
    "SimID" INTEGER NOT NULL,

    CONSTRAINT "simulatortypelist_pkey" PRIMARY KEY ("SimTypeID","SimID")
);

-- CreateTable
CREATE TABLE "simulatorbrand" (
    "BrandID" SERIAL NOT NULL,
    "BrandName" VARCHAR(32) NOT NULL,

    CONSTRAINT "simulatorbrand_pkey" PRIMARY KEY ("BrandID")
);

-- CreateTable
CREATE TABLE "simulatormodel" (
    "ModID" SERIAL NOT NULL,
    "ModelName" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "BrandID" INTEGER NOT NULL,

    CONSTRAINT "simulatormodel_pkey" PRIMARY KEY ("ModID")
);

-- CreateTable
CREATE TABLE "simulatorlist" (
    "SimID" SERIAL NOT NULL,
    "SimListName" VARCHAR(255) NOT NULL,
    "PricePerHour" DECIMAL(10,2) NOT NULL,
    "ListDescription" TEXT,
    "AddressDetail" TEXT NOT NULL,
    "Lat" DECIMAL(10,8) NOT NULL,
    "Long" DECIMAL(11,8) NOT NULL,
    "firstimage" VARCHAR(255) NOT NULL DEFAULT 'noimage.jpg',
    "secondimage" VARCHAR(255) NOT NULL DEFAULT 'noimage.jpg',
    "thirdimage" VARCHAR(255) NOT NULL DEFAULT 'noimage.jpg',
    "HostID" INTEGER NOT NULL,
    "ModID" INTEGER NOT NULL,

    CONSTRAINT "simulatorlist_pkey" PRIMARY KEY ("SimID")
);

-- CreateTable
CREATE TABLE "simulatorschedule" (
    "ScheduleID" SERIAL NOT NULL,
    "Price" DECIMAL(10,2) NOT NULL,
    "Date" DATE NOT NULL,
    "StartTime" TIME(0) NOT NULL,
    "EndTime" TIME(0) NOT NULL,
    "Available" BOOLEAN NOT NULL DEFAULT true,
    "SimID" INTEGER NOT NULL,

    CONSTRAINT "simulatorschedule_pkey" PRIMARY KEY ("ScheduleID")
);

-- CreateTable
CREATE TABLE "bookingstatus" (
    "StatusID" SERIAL NOT NULL,
    "Statusname" VARCHAR(16) NOT NULL,

    CONSTRAINT "bookingstatus_pkey" PRIMARY KEY ("StatusID")
);

-- CreateTable
CREATE TABLE "booking" (
    "BookingID" SERIAL NOT NULL,
    "BookingDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TotalPrice" DECIMAL(10,2) NOT NULL,
    "StatusID" INTEGER NOT NULL,
    "CustomerID" INTEGER NOT NULL,
    "SimID" INTEGER NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("BookingID")
);

-- CreateTable
CREATE TABLE "bookinglist" (
    "BookingID" INTEGER NOT NULL,
    "ScheduleID" INTEGER NOT NULL,

    CONSTRAINT "bookinglist_pkey" PRIMARY KEY ("BookingID","ScheduleID")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_Username_key" ON "customer"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "host_Username_key" ON "host"("Username");

-- AddForeignKey
ALTER TABLE "simulatortypelist" ADD CONSTRAINT "simulatortypelist_SimID_fkey" FOREIGN KEY ("SimID") REFERENCES "simulatorlist"("SimID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatortypelist" ADD CONSTRAINT "simulatortypelist_SimTypeID_fkey" FOREIGN KEY ("SimTypeID") REFERENCES "simulatortype"("SimTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatormodel" ADD CONSTRAINT "simulatormodel_BrandID_fkey" FOREIGN KEY ("BrandID") REFERENCES "simulatorbrand"("BrandID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_ModID_fkey" FOREIGN KEY ("ModID") REFERENCES "simulatormodel"("ModID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorlist" ADD CONSTRAINT "simulatorlist_HostID_fkey" FOREIGN KEY ("HostID") REFERENCES "host"("HostID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulatorschedule" ADD CONSTRAINT "simulatorschedule_SimID_fkey" FOREIGN KEY ("SimID") REFERENCES "simulatorlist"("SimID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_CustomerID_fkey" FOREIGN KEY ("CustomerID") REFERENCES "customer"("CustomerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_SimID_fkey" FOREIGN KEY ("SimID") REFERENCES "simulatorlist"("SimID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_StatusID_fkey" FOREIGN KEY ("StatusID") REFERENCES "bookingstatus"("StatusID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookinglist" ADD CONSTRAINT "bookinglist_BookingID_fkey" FOREIGN KEY ("BookingID") REFERENCES "booking"("BookingID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookinglist" ADD CONSTRAINT "bookinglist_ScheduleID_fkey" FOREIGN KEY ("ScheduleID") REFERENCES "simulatorschedule"("ScheduleID") ON DELETE RESTRICT ON UPDATE CASCADE;

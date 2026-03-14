-- CreateEnum
CREATE TYPE "FacilityCategory" AS ENUM ('HARDWARE', 'GAMES_AND_CONTENT', 'SEATING_AND_MOTION', 'CONNECTIVITY', 'ENVIRONMENT', 'VENUE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'BANNED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "review" (
    "ReviewID" SERIAL NOT NULL,
    "Comment" VARCHAR(1000),
    "OverallRating" SMALLINT NOT NULL,
    "BookingID" INTEGER NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("ReviewID")
);

-- CreateTable
CREATE TABLE "reviewtype" (
    "ReviewTypeID" SERIAL NOT NULL,
    "TypeName" VARCHAR(32) NOT NULL,

    CONSTRAINT "reviewtype_pkey" PRIMARY KEY ("ReviewTypeID")
);

-- CreateTable
CREATE TABLE "reviewlist" (
    "ReviewID" INTEGER NOT NULL,
    "TypeID" INTEGER NOT NULL,
    "Rating" SMALLINT NOT NULL,

    CONSTRAINT "reviewlist_pkey" PRIMARY KEY ("ReviewID","TypeID")
);

-- CreateTable
CREATE TABLE "customer_review" (
    "id" SERIAL NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "bookingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "category" "FacilityCategory" NOT NULL,

    CONSTRAINT "facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulator_facility" (
    "simId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulator_facility_pkey" PRIMARY KEY ("simId","facilityId")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "CustomerID" INTEGER NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_BookingID_key" ON "review"("BookingID");

-- CreateIndex
CREATE UNIQUE INDEX "customer_review_bookingId_key" ON "customer_review"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_BookingID_fkey" FOREIGN KEY ("BookingID") REFERENCES "booking"("BookingID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewlist" ADD CONSTRAINT "reviewlist_ReviewID_fkey" FOREIGN KEY ("ReviewID") REFERENCES "review"("ReviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewlist" ADD CONSTRAINT "reviewlist_TypeID_fkey" FOREIGN KEY ("TypeID") REFERENCES "reviewtype"("ReviewTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_review" ADD CONSTRAINT "customer_review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("BookingID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_facility" ADD CONSTRAINT "simulator_facility_simId_fkey" FOREIGN KEY ("simId") REFERENCES "simulatorlist"("SimID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_facility" ADD CONSTRAINT "simulator_facility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_CustomerID_fkey" FOREIGN KEY ("CustomerID") REFERENCES "customer"("CustomerID") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `vehicle_id` to the `Obd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `media` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licensePlate` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maintenance` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `malfunctions` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Obd" ADD COLUMN     "vehicle_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "media" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "phoneNumber",
ADD COLUMN     "error_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "licensePlate" TEXT NOT NULL,
ADD COLUMN     "maintenance" JSONB NOT NULL,
DROP COLUMN "malfunctions",
ADD COLUMN     "malfunctions" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "DateoOfBirth" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneNumber" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "job_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "media" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

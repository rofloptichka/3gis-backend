-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER', 'DRIVER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "currentMission" TEXT,
    "location" TEXT,
    "speed" INTEGER DEFAULT 0,
    "malfunctions" INTEGER DEFAULT 0,
    "vehicleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obd" (
    "id" SERIAL NOT NULL,
    "engineRpm" INTEGER NOT NULL,
    "vehicleSpeed" INTEGER NOT NULL,
    "throttlePosition" INTEGER NOT NULL,
    "fuelLevel" INTEGER NOT NULL,
    "engineLoad" INTEGER NOT NULL,
    "intakeAirTemperature" INTEGER NOT NULL,
    "massAirFlow" INTEGER NOT NULL,
    "fuelPressure" INTEGER NOT NULL,
    "fuelConsumptionRate" INTEGER NOT NULL,
    "engineCoolantTemperature" INTEGER NOT NULL,
    "oxygenSensorReading" INTEGER NOT NULL,
    "catalystTemperature" INTEGER NOT NULL,
    "evapEmissionControlPressure" INTEGER NOT NULL,
    "diagnosticTroubleCode" TEXT NOT NULL,
    "batteryVoltage" INTEGER NOT NULL,
    "transmissionFluidTemperature" INTEGER NOT NULL,
    "oilTemperature" INTEGER NOT NULL,
    "brakePedalPosition" INTEGER NOT NULL,
    "steeringAngle" INTEGER NOT NULL,
    "acceleratorPedalPosition" INTEGER NOT NULL,
    "absStatus" BOOLEAN NOT NULL,
    "airbagDeploymentStatus" BOOLEAN NOT NULL,
    "tirePressure" INTEGER NOT NULL,
    "gpsCoordinates" TEXT NOT NULL,
    "altitude" INTEGER NOT NULL,
    "heading" INTEGER NOT NULL,
    "distanceTraveled" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Obd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

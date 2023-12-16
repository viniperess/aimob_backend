-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "RealEstateType" AS ENUM ('HOUSE', 'APARTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "user" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "birthdate" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(255) NOT NULL,
    "street" VARCHAR(255),
    "number" VARCHAR(255),
    "complement" VARCHAR(255),
    "district" VARCHAR(255),
    "zipCode" VARCHAR(255),
    "city" VARCHAR(255),
    "phone" VARCHAR(255),
    "creci" VARCHAR(255),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "roles" "Role" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstate" (
    "id" SERIAL NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "number" VARCHAR(255) NOT NULL,
    "complement" VARCHAR(255),
    "district" VARCHAR(255) NOT NULL,
    "zipCode" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "builtArea" DECIMAL(10,2) NOT NULL,
    "totalArea" DECIMAL(10,2) NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "livingRooms" INTEGER NOT NULL,
    "kitchens" INTEGER NOT NULL,
    "garage" BOOLEAN NOT NULL DEFAULT false,
    "type" "RealEstateType" NOT NULL DEFAULT 'HOUSE',
    "description" VARCHAR(255) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "rentPrice" DECIMAL(10,2),
    "status" BOOLEAN NOT NULL DEFAULT false,
    "registration" VARCHAR(255) NOT NULL,
    "images" TEXT[],
    "userId" INTEGER NOT NULL,
    "clientUserId" INTEGER NOT NULL,

    CONSTRAINT "RealEstate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observation" VARCHAR(255),
    "visitDate" TIMESTAMP(3),
    "visitApproved" BOOLEAN,
    "userId" INTEGER NOT NULL,
    "clientUserId" INTEGER NOT NULL,
    "estateId" INTEGER NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "contractType" VARCHAR(255) NOT NULL,
    "formOfPayment" VARCHAR(255) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalValue" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2),
    "userId" INTEGER NOT NULL,
    "clientUserId" INTEGER NOT NULL,
    "estateId" INTEGER NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstate_registration_key" ON "RealEstate"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_estateId_key" ON "Contract"("estateId");

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "RealEstate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "RealEstate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

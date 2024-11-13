-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "RealEstate" ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Interest" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" INTEGER NOT NULL,
    "realEstateId" INTEGER NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

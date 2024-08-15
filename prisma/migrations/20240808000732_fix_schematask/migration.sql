/*
  Warnings:

  - You are about to drop the column `realEstateId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_realEstateId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "realEstateId",
ADD COLUMN     "estateId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

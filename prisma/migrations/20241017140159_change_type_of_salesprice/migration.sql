/*
  Warnings:

  - You are about to drop the column `rentPrice` on the `RealEstate` table. All the data in the column will be lost.
  - The `salePrice` column on the `RealEstate` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RealEstate" DROP COLUMN "rentPrice",
DROP COLUMN "salePrice",
ADD COLUMN     "salePrice" DOUBLE PRECISION;

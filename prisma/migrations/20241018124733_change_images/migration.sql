/*
  Warnings:

  - The `images` column on the `RealEstate` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RealEstate" DROP COLUMN "images",
ADD COLUMN     "images" TEXT[];

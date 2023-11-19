/*
  Warnings:

  - You are about to drop the column `password` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Owner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "password";

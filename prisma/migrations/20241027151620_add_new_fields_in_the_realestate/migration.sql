-- AlterTable
ALTER TABLE "RealEstate" ADD COLUMN     "pool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "yard" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "garage" SET DEFAULT false,
ALTER COLUMN "status" SET DEFAULT true;

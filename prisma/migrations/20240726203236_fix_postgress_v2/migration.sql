/*
  Warnings:

  - You are about to drop the column `contactId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `isAccepted` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_contactId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "contactId",
DROP COLUMN "isAccepted",
DROP COLUMN "type",
ADD COLUMN     "taskId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

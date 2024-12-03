-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_contactId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

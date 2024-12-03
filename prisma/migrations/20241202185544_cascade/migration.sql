-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_estateId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "RealEstate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [PrismaModule],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

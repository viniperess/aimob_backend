import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from 'src/prisma.module';
import { RealestatesModule } from 'src/realestates/realestates.module';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [PrismaModule, RealestatesModule],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

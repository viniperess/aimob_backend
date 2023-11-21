import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() appointment: Appointment) {
    return this.appointmentsService.create(
      appointment,
      appointment.clientId,
      appointment.employeeId,
      appointment.estateId,
    );
  }

  @Get()
  findAll(): Promise<Appointment[]> {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Appointment | null> {
    return this.appointmentsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() appointment: Appointment,
  ): Promise<Appointment> {
    return this.appointmentsService.update(+id, appointment);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<Appointment> {
    return this.appointmentsService.remove(+id);
  }
}

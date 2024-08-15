import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @IsPublic()
  @Post('create-by-corrector')
  createByCorretor(
    @Body() appointment: Appointment,
    @Req() request: AuthRequest,
  ) {
    return this.appointmentsService.create(appointment, request);
  }

  @IsPublic()
  @Post('create-by-contact')
  createByContact(@Body() appointment: Appointment) {
    return this.appointmentsService.create(appointment);
  }

  @Get()
  findAll(): Promise<Appointment[]> {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Appointment | null> {
    return this.appointmentsService.findOne(+id);
  }

  @Patch(':id')
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

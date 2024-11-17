import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { AuthRequest } from 'src/auth/models/AuthRequest';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @IsPublic()
  @Post('create')
  async createByContact(@Body() appointment: Appointment) {
    return this.appointmentsService.create(appointment);
  }

  @Get()
  async findAll(@Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.appointmentsService.findAll(userId);
  }

  @Get('report')
  async getClientReport(
    @Query('filter')
    filter: 'all' | 'completed' | 'pending' | 'monthly' | 'progress',
    @Query('month') month: number,
    @Res() res: Response,
    @Req() request: AuthRequest,
  ) {
    const userId = request.user.id;
    const pdfBuffer = await this.appointmentsService.generateAppointmentReport(
      filter,
      userId,
      month,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio-agendamentos.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
  @Get(':id')
  async findOne(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.appointmentsService.findOne(+id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() appointment: Appointment,
    @Req() request: AuthRequest,
  ): Promise<Appointment> {
    const userId = request.user.id;
    return this.appointmentsService.update(+id, appointment, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: number,
    @Req() request: AuthRequest,
  ): Promise<Appointment> {
    const userId = request.user.id;
    return this.appointmentsService.remove(+id, userId);
  }
}

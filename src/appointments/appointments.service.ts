import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment, PrismaClient } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    const { userId, clientUserId, estateId, ...appointmentsData } = data;

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const client = await this.prisma.user.findUnique({
      where: { id: clientUserId },
    });

    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { id: estateId },
    });

    if (!creator || !client || !existingRealEstate) {
      throw new NotFoundException('User or Real Estate not found.');
    }

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: { visitDate: data.visitDate },
    });

    if (existingAppointment) {
      throw new NotFoundException('Appointment with this date not available');
    }

    const createdAppointment = await this.prisma.appointment.create({
      data: {
        ...appointmentsData,
        employee: { connect: { id: userId } },
        client: { connect: { id: clientUserId } },
        realEstate: { connect: { id: estateId } },
      },
    });

    return createdAppointment;
  }

  async findAll(): Promise<Appointment[]> {
    const foundAllAppointment = await this.prisma.appointment.findMany({
      include: {
        employee: true,
        client: true,
        realEstate: true,
      },
    });
    return foundAllAppointment;
  }

  async findOne(id: number): Promise<Appointment> {
    const foundOneAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        employee: true,
        client: true,
        realEstate: true,
      },
    });
    return foundOneAppointment;
  }

  async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data,
    });
    return updatedAppointment;
  }

  async remove(id: number) {
    const deletedAppointment = await this.prisma.appointment.delete({
      where: { id },
    });
    return deletedAppointment;
  }
}

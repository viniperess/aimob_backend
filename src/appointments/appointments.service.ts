import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment, PrismaClient } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: any,
    clientId: number,
    employeeId: number,
    estateId: number,
  ) {
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const existingClient = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { id: estateId },
    });

    if (existingEmployee && existingClient && existingRealEstate) {
      const existingAppointment = await this.prisma.appointment.findFirst({
        where: { visitDate: data.visitDate },
      });

      if (existingAppointment) {
        throw new NotFoundException('Appointment with this date not available');
      }

      const createdAppointment = await this.prisma.appointment.create({
        data: {
          ...data,
          clientId: clientId,
          employeeId: employeeId,
          estateId: estateId,
        },
      });

      return createdAppointment;
    } else {
      throw new NotFoundException(
        'Client or Real Estate or Employee not found.',
      );
    }
  }

  async findAll(): Promise<Appointment[]> {
    const foundAllAppointment = await this.prisma.appointment.findMany({
      include: {
        Client: true,
        Employee: true,
        RealEstate: true,
      },
    });
    return foundAllAppointment;
  }

  async findOne(id: number): Promise<Appointment> {
    const foundOneAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        Client: true,
        Employee: true,
        RealEstate: true,
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

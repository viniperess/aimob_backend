import { Injectable } from '@nestjs/common';
import { PrismaClient, Task } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    const { estateId, appointmentId, contactId } = data;

    let userId = null;

    if (estateId) {
      const realEstate = await this.prisma.realEstate.findUnique({
        where: { id: estateId },
      });
      if (realEstate) {
        userId = realEstate.userId;
      }
    }

    const existingTask = await this.prisma.task.findFirst({
      where: {
        appointmentId,
        contactId,
        estateId,
      },
    });

    if (existingTask) {
      return existingTask;
    }

    const createTask = await this.prisma.task.create({
      data: {
        ...data,
        userId,
      },
    });

    return createTask;
  }

  async findAll() {
    const foundAllTasks = await this.prisma.task.findMany({
      include: {
        contact: true,
        appointment: true,
        realEstate: true,
      },
    });
    return foundAllTasks;
  }

  async findOne(id: number) {
    const foundOneTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        contact: true,
        appointment: true,
        realEstate: true,
      },
    });
    return foundOneTask;
  }

  async update(id: number, data: Partial<Task>) {
    const updateTask = await this.prisma.task.update({
      where: { id },
      data,
    });
    return updateTask;
  }

  async remove(id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id },
      include: {
        contact: true,
        appointment: true,
      },
    });
    if (!task) {
      throw new Error('Task not found');
    }
    const contactId = task.contact?.id;
    const appointmentId = task.appointment?.id;

    const deleteTask = await this.prisma.task.delete({
      where: { id },
    });

    if (contactId) {
      const remainingTasks = await this.prisma.task.findMany({
        where: { contactId },
      });

      if (remainingTasks.length === 0) {
        await this.prisma.contact.delete({
          where: { id: contactId },
        });

        if (appointmentId) {
          await this.prisma.appointment.delete({
            where: { id: appointmentId },
          });
        }
      }
    }

    return deleteTask;
  }
}

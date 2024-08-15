import { Injectable } from '@nestjs/common';
import { PrismaClient, Task } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    const { estateId, appointmentId, contactId } = data;

    // Busca o userId baseado no estateId, se fornecido
    let userId = null;

    if (estateId) {
      const realEstate = await this.prisma.realEstate.findUnique({
        where: { id: estateId },
      });
      if (realEstate) {
        userId = realEstate.userId;
      }
    }

    // Verifica se já existe uma Task com o mesmo appointmentId, contactId e estateId para evitar duplicação
    const existingTask = await this.prisma.task.findFirst({
      where: {
        appointmentId,
        contactId,
        estateId,
      },
    });

    if (existingTask) {
      // Se a task já existe, retorne a existente em vez de criar uma nova
      return existingTask;
    }

    // Cria uma nova task se não houver uma duplicata
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
    const deleteTask = await this.prisma.task.delete({
      where: { id },
    });
    return deleteTask;
  }
}

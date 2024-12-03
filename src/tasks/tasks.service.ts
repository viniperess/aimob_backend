import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    if (!userId) {
      throw new BadRequestException(
        'A tarefa deve estar associada a um usuário.',
      );
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
    try {
      const createTask = await this.prisma.task.create({
        data: {
          ...data,
          userId,
        },
      });

      return createTask;
    } catch (error) {
      console.error('Erro ao criar a tarefa:', error);
      throw new InternalServerErrorException('Erro ao criar a tarefa.');
    }
  }

  async findAll(userId: number) {
    try {
      return await this.prisma.task.findMany({
        where: { userId },
        include: {
          contact: true,
          appointment: true,
          realEstate: true,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      throw new InternalServerErrorException('Erro ao buscar tarefas.');
    }
  }

  async findOne(id: number, userId: number) {
    const foundOneTask = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        contact: true,
        appointment: true,
        realEstate: true,
      },
    });

    if (!foundOneTask) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    return foundOneTask;
  }
  async update(id: number, data: Partial<Task>, userId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada ou acesso negado.');
    }
    try {
      const updateTask = await this.prisma.task.update({
        where: { id },
        data,
      });
      return updateTask;
    } catch (error) {
      console.error('Erro ao atualizar a tarefa:', error);
      throw new InternalServerErrorException('Erro ao atualizar a tarefa.');
    }
  }

  async remove(id: number, userId: number) {
    console.log('Tentando excluir tarefa:', id, 'Usuário:', userId);

    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        contact: true,
        appointment: true,
      },
    });

    if (!task) {
      console.error('Tarefa não encontrada ou acesso negado:', id);
      throw new NotFoundException('Tarefa não encontrada ou acesso negado.');
    }

    const contactId = task.contact?.id;
    const appointmentId = task.appointment?.id;

    try {
      console.log('Excluindo tarefa:', id);
      const deletedTask = await this.prisma.task.delete({
        where: { id },
      });
      console.log('Tarefa excluída com sucesso:', deletedTask);

      if (appointmentId) {
        console.log('Excluindo agendamento associado:', appointmentId);
        await this.prisma.appointment.delete({
          where: { id: appointmentId },
        });
      }

      if (contactId) {
        console.log('Verificando tarefas restantes para o contato:', contactId);
        const remainingTasks = await this.prisma.task.findMany({
          where: { contactId },
        });

        if (remainingTasks.length === 0) {
          console.log('Nenhuma tarefa restante. Excluindo contato:', contactId);
          await this.prisma.contact.delete({
            where: { id: contactId },
          });
        }
      }
      return deletedTask;
    } catch (error) {
      console.error('Erro ao excluir a tarefa:', error);
      throw new InternalServerErrorException('Erro ao excluir a tarefa.');
    }
  }
}

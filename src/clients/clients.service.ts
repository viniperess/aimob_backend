import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Client, PrismaClient } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any, userId: number): Promise<Client> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (existingUser && existingUser.roles === 'CLIENT') {
      const existingClient = await this.prisma.client.findUnique({
        where: { userId },
      });
      if (existingClient) {
        throw new NotFoundException('Client already exists for this user.');
      }

      const createdClient = await this.prisma.client.create({
        data: {
          ...data,
          userId: userId,
        },
      });

      return createdClient;
    } else {
      throw new NotFoundException('User does not have the role of CLIENT');
    }
  }
  private async removePreviousRole(userId: number): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // O usuário não existe, não há nada para excluir
        return;
      }

      if (user.roles !== null) {
        switch (user.roles) {
          case 'EMPLOYEE':
            await this.prisma.employee.delete({ where: { userId } });
            break;
          case 'CLIENT':
            await this.prisma.client.delete({ where: { userId } });
            break;
          case 'OWNER':
            // Verifique se há dependências antes de excluir
            const existingOwner = await this.prisma.owner.findUnique({
              where: { userId },
            });

            if (existingOwner) {
              await this.prisma.owner.delete({ where: { userId } });
            }
            break;
        }
      }
    } catch (error) {
      console.error(`Erro ao excluir registro: ${error.message}`);
      throw new InternalServerErrorException(
        'Erro interno ao excluir registro.',
      );
    }
  }
  async findAll(): Promise<Client[]> {
    const foundAllClient = await this.prisma.client.findMany({
      include: {
        User: true,
      },
    });
    return foundAllClient;
  }

  async findOne(id: number): Promise<Client | null> {
    const foundOneClient = await this.prisma.client.findUnique({
      where: { id },
      include: {
        User: true,
      },
    });
    return foundOneClient;
  }

  async update(id: number, data: Partial<Client>): Promise<Client> {
    const updatedClient = await this.prisma.client.update({
      where: { id },
      data,
    });
    return updatedClient;
  }

  async remove(id: number) {
    const deletedClient = await this.prisma.client.delete({
      where: { id },
    });
    return deletedClient;
  }
}

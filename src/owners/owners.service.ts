import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Owner, PrismaClient } from '@prisma/client';
@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any, userId: number): Promise<Owner> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (existingUser && existingUser.roles === 'OWNER') {
      const existingOwner = await this.prisma.owner.findUnique({
        where: { userId },
      });
      if (existingOwner) {
        throw new NotFoundException('Owner already exists for this user.');
      }

      const createdOwner = await this.prisma.owner.create({
        data: {
          ...data,
          userId: userId,
        },
      });
      return createdOwner;
    } else {
      throw new NotFoundException('User does not have the role of OWNER');
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

  async findAll(): Promise<Owner[]> {
    const foundAllOwner = await this.prisma.owner.findMany({
      include: {
        User: true,
      },
    });
    return foundAllOwner;
  }

  async findOne(id: number): Promise<Owner | null> {
    const foundOneOwner = await this.prisma.owner.findUnique({
      where: { id },
      include: {
        User: true,
      },
    });
    return foundOneOwner;
  }

  async update(id: number, data: Partial<Owner>): Promise<Owner> {
    const updatedOwner = await this.prisma.owner.update({
      where: { id },
      data,
    });
    return updatedOwner;
  }

  async remove(id: number) {
    const deletedOwner = await this.prisma.owner.delete({
      where: { id },
    });
    return deletedOwner;
  }
}

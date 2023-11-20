import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee, PrismaClient } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any, userId: number): Promise<Employee> {
    console.log('Creating employee for user ID:', userId);
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    console.log('Existing user:', existingUser);
    if (existingUser && existingUser.roles === 'EMPLOYEE') {
      // await this.removePreviousRole(userId);
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      console.log('Existing employee:', existingEmployee);
      if (existingEmployee) {
        throw new NotFoundException('Employee already exists for this user.');
      }

      const createdEmployee = await this.prisma.employee.create({
        data: {
          ...data,
          userId: userId,
        },
      });

      console.log('Employee created:', createdEmployee);
      return createdEmployee;
    } else {
      throw new NotFoundException('User does not have the role of EMPLOYEE.');
    }
  }
  // private async removePreviousRole(userId: number): Promise<void> {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (user && user.roles !== null) {
  //     switch (user.roles) {
  //       case 'EMPLOYEE':
  //         await this.prisma.employee.delete({ where: { userId } });
  //         break;
  //       case 'CLIENT':
  //         await this.prisma.client.delete({ where: { userId } });
  //         break;
  //       case 'OWNER':
  //         await this.prisma.owner.delete({ where: { userId } });
  //         break;
  //     }
  //   }
  // }

  async findAll(): Promise<Employee[]> {
    const foundAllEmployee = await this.prisma.employee.findMany({
      include: {
        User: true, // Inclui os dados do usuário associado
      },
    });
    return foundAllEmployee;
  }

  async findOne(id: number): Promise<Employee> {
    const foundOneEmployee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        User: true, // Inclui os dados do usuário associado
      },
    });
    return foundOneEmployee;
  }

  async update(id: number, data: Partial<Employee>): Promise<Employee> {
    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data,
    });
    return updatedEmployee;
  }

  async remove(id: number) {
    const deletedEmployee = await this.prisma.employee.delete({
      where: { id },
    });
    return deletedEmployee;
  }
}

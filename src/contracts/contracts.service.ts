import { Injectable, NotFoundException } from '@nestjs/common';
import { Contract, PrismaClient } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: any,
    employeeId: number,
    estateId?: number,
    clientId?: number,
  ) {
    const createdContract = await this.prisma.contract.create({
      data: {
        ...data,
        clientId: clientId,
        employeeId: employeeId,
        estateId: estateId,
      },
    });

    return createdContract;
  }

  async findAll(): Promise<Contract[]> {
    const foundAllContract = await this.prisma.contract.findMany({
      include: {
        Client: true,
        Employee: true,
        RealEstate: true,
      },
    });
    return foundAllContract;
  }

  async findOne(id: number): Promise<Contract> {
    const foundOneContract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        Client: true,
        Employee: true,
        RealEstate: true,
      },
    });
    return foundOneContract;
  }

  async update(id: number, data: Partial<Contract>): Promise<Contract> {
    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data,
    });
    return updatedContract;
  }

  async remove(id: number) {
    const deletedContract = await this.prisma.contract.delete({
      where: { id },
    });
    return deletedContract;
  }
}

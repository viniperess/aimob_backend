import { Injectable, NotFoundException } from '@nestjs/common';
import { Contract, PrismaClient } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    const { userId, clientUserId, estateId, ...contractsData } = data;

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const client = await this.prisma.user.findUnique({
      where: { id: clientUserId },
    });

    console.log('Estate ID:', estateId);
    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { id: Number(estateId) },
    });
    if (!creator || !client || !existingRealEstate) {
      throw new NotFoundException('User or Real Estate not found.');
    }

    const createdContract = await this.prisma.contract.create({
      data: {
        ...contractsData,
        employee: { connect: { id: userId } },
        client: { connect: { id: clientUserId } },
        realEstate: { connect: { id: estateId } },
      },
    });

    return createdContract;
  }

  async findAll(): Promise<Contract[]> {
    const foundAllContract = await this.prisma.contract.findMany({
      include: {
        employee: true,
        client: true,
        realEstate: true,
      },
    });
    return foundAllContract;
  }

  async findOne(id: number): Promise<Contract> {
    const foundOneContract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        employee: true,
        client: true,
        realEstate: true,
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

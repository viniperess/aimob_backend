import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';

@Injectable()
export class RealestatesService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: any,
    ownerId: number,
    employeeId: number,
  ): Promise<RealEstate> {
    const existingOwner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });

    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (existingOwner && existingEmployee) {
      const existingRealEstate = await this.prisma.realEstate.findUnique({
        where: { registration: data.registration },
      });

      if (existingRealEstate) {
        throw new NotFoundException(
          'RealEstate with this registration already exists.',
        );
      }

      const createdRealEstate = await this.prisma.realEstate.create({
        data: {
          ...data,
          ownerId: ownerId,
          employeeId: employeeId,
        },
      });

      return createdRealEstate;
    } else {
      throw new NotFoundException('Owner or Employee not found.');
    }
  }

  async findAll(): Promise<RealEstate[]> {
    const foundAllRealEstate = await this.prisma.realEstate.findMany({
      include: {
        Owner: true,
        Employee: true,
      },
    });
    return foundAllRealEstate;
  }

  async findOne(id: number): Promise<RealEstate> {
    const foundOneRealEstate = await this.prisma.realEstate.findUnique({
      where: { id },
      include: {
        Owner: true,
        Employee: true,
      },
    });
    return foundOneRealEstate;
  }

  async update(id: number, data: Partial<RealEstate>): Promise<RealEstate> {
    const updatedRealEstate = await this.prisma.realEstate.update({
      where: { id },
      data,
    });
    return updatedRealEstate;
  }

  async remove(id: number) {
    const deletedRealEstate = await this.prisma.realEstate.delete({
      where: {
        id,
      },
    });
    return deletedRealEstate;
  }
}

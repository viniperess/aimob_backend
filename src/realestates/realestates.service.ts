import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';

@Injectable()
export class RealestatesService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any): Promise<RealEstate> {
    const { userId, clientUserId, ...realEstateData } = data;

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const client = await this.prisma.user.findUnique({
      where: { id: clientUserId },
    });

    if (!creator || !client) {
      throw new NotFoundException('User not found.');
    }

    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { registration: realEstateData.registration },
    });

    if (existingRealEstate) {
      throw new NotFoundException(
        'RealEstate with this registration already exists.',
      );
    }

    const createdRealEstate = await this.prisma.realEstate.create({
      data: {
        ...realEstateData,
        employee: { connect: { id: userId } },
        client: { connect: { id: clientUserId } },
      },
    });

    return createdRealEstate;
  }

  async findAll(): Promise<RealEstate[]> {
    const foundAllRealEstate = await this.prisma.realEstate.findMany({
      include: {
        employee: true,
        client: true,
      },
    });
    return foundAllRealEstate;
  }

  async findOne(id: number): Promise<RealEstate> {
    const foundOneRealEstate = await this.prisma.realEstate.findUnique({
      where: { id },
      include: {
        employee: true,
        client: true,
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

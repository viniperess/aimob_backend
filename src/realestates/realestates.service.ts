import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';

@Injectable()
export class RealestatesService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any, request: AuthRequest) {
    const { ...realEstateData } = data;
    const userId = request.user.id;
    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { registration: realEstateData.registration },
    });

    if (existingRealEstate) {
      throw new NotFoundException(
        'RealEstate with this registration already exists.',
      );
    }
    console.log('User ID:', userId);

    const createdRealEstate = await this.prisma.realEstate.create({
      data: {
        ...realEstateData,
        userId: userId,
      },
    });

    return createdRealEstate;
  }

  async findAll(): Promise<RealEstate[]> {
    const foundAllRealEstate = await this.prisma.realEstate.findMany();

    return foundAllRealEstate;
  }

  async findOne(id: number): Promise<RealEstate> {
    const foundOneRealEstate = await this.prisma.realEstate.findUnique({
      where: { id },
    });
    return foundOneRealEstate;
  }

  async searchRealEstate(type: string): Promise<RealEstate[]> {
    try {
      console.log('Tipo recebido para pesquisa:', type);
      const searchResults = await this.prisma.realEstate.findMany({
        where: {
          type: {
            contains: type,
            mode: 'insensitive',
          },
        },
      });
      return searchResults;
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
      throw new Error('Erro ao buscar imóveis');
    }
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

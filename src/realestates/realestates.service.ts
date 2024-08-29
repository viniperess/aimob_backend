import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';

@Injectable()
export class RealestatesService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: any,
    request: AuthRequest,
    images?: Express.Multer.File[],
  ) {
    const { ...realEstateData } = data;
    const userId = request.user.id;
    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { registration: realEstateData.registration },
    });

    if (images && images.length > 0) {
      const imageStrings = images.map((image) =>
        image.buffer.toString('base64'),
      );

      data.images = [...realEstateData.images, ...imageStrings];
    }

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

  async update(
    id: number,
    data: Partial<RealEstate>,
    images?: Express.Multer.File[],
  ): Promise<RealEstate> {
    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { id },
    });
    if (images && images.length > 0) {
      const imageStrings = images.map((images) =>
        images.buffer.toString('base64'),
      );

      data.images = [...existingRealEstate.images, ...imageStrings];
    }
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

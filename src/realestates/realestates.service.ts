import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';
import * as PDFDocument from 'pdfkit';
import { S3 } from 'aws-sdk';

@Injectable()
export class RealestatesService {
  private s3: S3;
  constructor(private prisma: PrismaClient) {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }
  async uploadToS3(image: Express.Multer.File): Promise<string> {
    const params = {
      Bucket: 'bucket-aimob-images',
      Key: `${Date.now()}-${image.originalname}`, // Use um nome único para o arquivo
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult.Location; // Retorna a URL da imagem
  }
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
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const url = await this.uploadToS3(image);
          console.log('Uploaded image URL:', url); // Log da URL da imagem
          return url;
        }),
      );
      console.log('All uploaded image URLs:', imageUrls); // Log de todas as URLs
      realEstateData.images = imageUrls; // Adiciona os URLs das imagens
    }
    if (realEstateData.salePrice) {
      realEstateData.salePrice = Number(realEstateData.salePrice);
    }
    realEstateData.garage = !!realEstateData.garage;
    realEstateData.status = !!realEstateData.status;

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

  async advanceSearch(filters: {
    bedrooms?: string;
    bathrooms?: string;
    kitchens?: string;
    livingRooms?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: string;
    garage?: string;
    yard?: string;
    pool?: string;
  }): Promise<RealEstate[]> {
    const parseFilters = (filters: any) => {
      return {
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        kitchens: filters.kitchens,
        livingRooms: filters.livingRooms,
        minPrice: filters.minPrice
          ? parseFloat(filters.minPrice.trim())
          : undefined,
        maxPrice: filters.maxPrice
          ? parseFloat(filters.maxPrice.trim())
          : undefined,
        type: filters.type,
        garage: filters.garage ? filters.garage.trim() === 'true' : undefined,
        yard: filters.yard ? filters.yard.trim() === 'true' : undefined,
        pool: filters.pool ? filters.pool.trim() === 'true' : undefined,
      };
    };
    const cleanedFilters = parseFilters(filters);
    console.log('Filtros limpos recebidos no serviço:', cleanedFilters);
    const whereConditions: any = {};

    if (cleanedFilters.bedrooms) {
      whereConditions.bedrooms = cleanedFilters.bedrooms;
      console.log('Filtro de quartos aplicado:', cleanedFilters.bedrooms);
    }
    if (cleanedFilters.bathrooms) {
      whereConditions.bathrooms = cleanedFilters.bathrooms;
      console.log('Filtro de banheiros aplicado:', cleanedFilters.bathrooms);
    }
    if (cleanedFilters.kitchens) {
      whereConditions.kitchens = cleanedFilters.kitchens;
      console.log('Filtro de cozinhas aplicado:', cleanedFilters.kitchens);
    }
    if (cleanedFilters.livingRooms) {
      whereConditions.livingRooms = cleanedFilters.livingRooms;
      console.log('Filtro de salas aplicado:', cleanedFilters.livingRooms);
    }
    if (cleanedFilters.minPrice || cleanedFilters.maxPrice) {
      whereConditions.salePrice = {
        ...(cleanedFilters.minPrice && { gte: cleanedFilters.minPrice }),
        ...(cleanedFilters.maxPrice && { lte: cleanedFilters.maxPrice }),
      };
      console.log('Filtro de preço aplicado:', whereConditions.salePrice);
    }
    if (cleanedFilters.type) {
      whereConditions.type = cleanedFilters.type;
      console.log('Filtro de tipo aplicado:', cleanedFilters.type);
    }
    if (cleanedFilters.garage !== undefined) {
      whereConditions.garage = cleanedFilters.garage;
      console.log('Filtro de garagem aplicado:', cleanedFilters.garage);
    }
    if (cleanedFilters.yard !== undefined) {
      whereConditions.yard = cleanedFilters.yard;
      console.log('Filtro de pátio aplicado:', cleanedFilters.yard);
    }
    if (cleanedFilters.pool !== undefined) {
      whereConditions.pool = cleanedFilters.pool;
      console.log('Filtro de piscina aplicado:', cleanedFilters.pool);
    }

    console.log('Condições finais da busca:', whereConditions);

    const results = await this.prisma.realEstate.findMany({
      where: whereConditions,
    });

    console.log('Resultado final da consulta:', results);
    return results;
  }

  async update(
    id: number,
    data: Partial<RealEstate>,
    images?: Express.Multer.File[],
  ): Promise<RealEstate> {
    const existingRealEstate = await this.prisma.realEstate.findUnique({
      where: { id },
    });

    if (!existingRealEstate) {
      throw new NotFoundException('RealEstate not found.');
    }

    const updatedData: Partial<RealEstate> = {
      street: data.street || existingRealEstate.street,
      number: data.number || existingRealEstate.number,
      complement: data.complement || existingRealEstate.complement,
      district: data.district || existingRealEstate.district,
      zipCode: data.zipCode || existingRealEstate.zipCode,
      city: data.city || existingRealEstate.city,
      state: data.state || existingRealEstate.state,
      builtArea: data.builtArea || existingRealEstate.builtArea,
      totalArea: data.totalArea || existingRealEstate.totalArea,
      bedrooms: data.bedrooms || existingRealEstate.bedrooms,
      bathrooms: data.bathrooms || existingRealEstate.bathrooms,
      livingRooms: data.livingRooms || existingRealEstate.livingRooms,
      kitchens: data.kitchens || existingRealEstate.kitchens,
      garage:
        data.garage !== undefined
          ? Boolean(data.garage)
          : existingRealEstate.garage,
      type: data.type || existingRealEstate.type,
      description: data.description || existingRealEstate.description,
      salePrice:
        data.salePrice !== undefined
          ? Number(data.salePrice)
          : existingRealEstate.salePrice,
      status:
        data.status !== undefined
          ? Boolean(data.status)
          : existingRealEstate.status,
      registration: data.registration || existingRealEstate.registration,
      images: [], // Inicializa como um array vazio
    };

    // Verifica se novas imagens foram enviadas
    if (images && images.length > 0) {
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const url = await this.uploadToS3(image);
          console.log('Uploaded image URL:', url);
          return url;
        }),
      );
      updatedData.images = imageUrls; // Substitui as imagens existentes pelas novas
    } else {
      // Se não houver novas imagens, mantenha as existentes
      updatedData.images = existingRealEstate.images;
    }

    // Atualiza os dados
    const updatedRealEstate = await this.prisma.realEstate.update({
      where: { id },
      data: updatedData,
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

  async generateRealEstateReport(filters: any) {
    const whereConditions: any = {};

    if (filters.minPrice || filters.maxPrice) {
      const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice
        ? Number(filters.maxPrice)
        : Number.MAX_SAFE_INTEGER;

      whereConditions.salePrice = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    if (filters.bedrooms) {
      whereConditions.bedrooms = filters.bedrooms;
    }
    if (filters.bathrooms) {
      whereConditions.bathrooms = filters.bathrooms;
    }
    if (filters.status !== undefined) {
      whereConditions.status = filters.status === 'true';
    }
    console.log('Filtros aplicados no backend:', whereConditions);
    const realEstateReport = await this.prisma.realEstate.findMany({
      where: whereConditions,
    });

    return this.generatePdfReport(realEstateReport);
  }
  async generatePdfReport(realEstates: RealEstate[]): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, left: 50, right: 50, bottom: 50 },
    });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      return pdfBuffer;
    });

    doc
      .fontSize(20)
      .text('Relatório de Imóveis', { align: 'center' })
      .image(
        '../my-frontend-app/src/assets/images/logosemfundo_azul.png',
        480,
        20,
        { width: 80 },
      )
      .moveDown();

    doc
      .fontSize(12)
      .text(`Data de Emissão: ${new Date().toLocaleDateString()}`, {
        align: 'right',
      })
      .moveDown();

    doc.fontSize(12).font('Helvetica');

    realEstates.forEach((realEstate) => {
      doc
        .fillColor('#000000')
        .text(
          `Endereço: ${realEstate.street}, ${realEstate.number}, ${realEstate.city} - ${realEstate.state}`,
          { width: 500 },
        )
        .text(`Registro: ${realEstate.registration || 'N/A'}`, { width: 500 })
        .text(`Área Construída: ${realEstate.builtArea || 'N/A'} m²`, {
          width: 500,
        })
        .text(`Área Total: ${realEstate.totalArea || 'N/A'} m²`, { width: 500 })
        .text(`Quartos: ${realEstate.bedrooms || 'N/A'}`, { width: 500 })
        .text(`Banheiros: ${realEstate.bathrooms || 'N/A'}`, { width: 500 })
        .text(`Garagem: ${realEstate.garage ? 'Sim' : 'Não'}`, { width: 500 })
        .text(
          `Preço de Venda: ${
            realEstate.salePrice ? `R$ ${realEstate.salePrice}` : 'N/A'
          }`,
          { width: 500 },
        )
        .text(`Status: ${realEstate.status ? 'Disponível' : 'Indisponível'}`, {
          width: 500,
        })
        .moveDown(1);

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }
}

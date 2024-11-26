import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';
import PDFDocument = require('pdfkit');
import { S3 } from 'aws-sdk';
import axios from 'axios';

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
    try {
      const params = {
        Bucket: 'bucket-aimob-images',
        Key: `${Date.now()}-${image.originalname}`,
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      const uploadResult = await this.s3.upload(params).promise();
      return uploadResult.Location;
    } catch (error) {
      console.error('Erro ao fazer upload para o S3:', error);
      throw new InternalServerErrorException('Erro ao fazer upload da imagem.');
    }
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

    if (existingRealEstate) {
      throw new BadRequestException('Imóvel com este registro já existe.');
    }
    console.log('User ID:', userId);

    try {
      if (images && images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(async (image) => {
            const url = await this.uploadToS3(image);
            console.log('Uploaded image URL:', url);
            return url;
          }),
        );
        console.log('All uploaded image URLs:', imageUrls);
        realEstateData.images = imageUrls;
      }
      if (realEstateData.salePrice) {
        realEstateData.salePrice = Number(realEstateData.salePrice);
      }
      realEstateData.garage = !!realEstateData.garage;
      realEstateData.status = !!realEstateData.status;
      realEstateData.yard = !!realEstateData.yard;
      realEstateData.pool = !!realEstateData.pool;
      realEstateData.isPosted = !!realEstateData.isPosted;
      const createdRealEstate = await this.prisma.realEstate.create({
        data: {
          ...realEstateData,
          userId: userId,
        },
      });

      const realEstateUrl = `${process.env.FRONTEND_URL}/${createdRealEstate.id}`;

      if (data.isPosted) {
        const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;

        const message = `\n🏠 Novo imóvel disponível\n💬 ${realEstateData.description}\n💵 R$ ${realEstateData.salePrice}\n🔗 Confira mais detalhes: ${realEstateUrl}`;

        try {
          if (realEstateData.images?.length > 0) {
            // Passo 1: Carregar as imagens com `published: false`
            const attachedMedia = await Promise.all(
              realEstateData.images.map(async (imageUrl) => {
                const response = await axios.post(
                  `https://graph.facebook.com/v16.0/${pageId}/photos`,
                  {
                    url: imageUrl,
                    published: false, // Define que a imagem não será publicada diretamente
                    access_token: pageAccessToken,
                  },
                );
                console.log(
                  'Imagem publicada no álbum (não publicada):',
                  response.data,
                );
                return { media_fbid: response.data.id };
              }),
            );

            // Passo 2: Criar a postagem no feed com as imagens
            const postResponse = await axios.post(
              `https://graph.facebook.com/v16.0/${pageId}/feed`,
              {
                message,
                attached_media: attachedMedia, // Vincula as imagens carregadas ao feed
                access_token: pageAccessToken,
              },
            );

            console.log(
              'Resposta da publicação com imagens no feed:',
              postResponse.data,
            );

            // Atualiza o status de publicação no banco de dados
            if (postResponse.data.id) {
              await this.prisma.realEstate.update({
                where: { id: createdRealEstate.id },
                data: { isPosted: true },
              });
            }
          } else {
            // Publicação sem imagens
            const postResponse = await axios.post(
              `https://graph.facebook.com/v16.0/${pageId}/feed`,
              {
                message,
                access_token: pageAccessToken,
              },
            );

            console.log(
              'Resposta da publicação sem imagens no feed:',
              postResponse.data,
            );

            if (postResponse.data.id) {
              await this.prisma.realEstate.update({
                where: { id: createdRealEstate.id },
                data: { isPosted: true },
              });
            }
          }
        } catch (error) {
          console.error(
            'Erro ao postar no Facebook:',
            error.response?.data || error,
          );
        }
      }

      return createdRealEstate;
    } catch (error) {
      console.error('Erro ao criar imóvel:', error);
      throw new InternalServerErrorException('Erro ao criar o imóvel.');
    }
  }

  async findAll(userId: number): Promise<RealEstate[]> {
    try {
      return await this.prisma.realEstate.findMany({
        where: { userId },
        orderBy: { viewsCount: 'desc' },
      });
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
      throw new InternalServerErrorException('Erro ao buscar imóveis.');
    }
  }
  async findAllAvailable(): Promise<RealEstate[]> {
    try {
      return await this.prisma.realEstate.findMany({
        where: { status: true },
        orderBy: { viewsCount: 'desc' },
      });
    } catch (error) {
      console.error('Erro ao buscar imóveis disponíveis:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar imóveis disponíveis.',
      );
    }
  }
  async findOne(id: number): Promise<RealEstate> {
    const foundOneRealEstate = await this.prisma.realEstate.findFirst({
      where: { id },
    });

    if (!foundOneRealEstate) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    await this.prisma.realEstate.update({
      where: { id },
      data: {
        viewsCount: foundOneRealEstate.viewsCount + 1,
      },
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
      throw new InternalServerErrorException('Erro ao buscar imóveis');
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
    try {
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
    } catch (error) {
      console.error('Erro ao realizar busca avançada:', error);
      throw new InternalServerErrorException(
        'Erro ao realizar busca avançada.',
      );
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
    const booleanFields = ['garage', 'yard', 'pool', 'status', 'isPosted'];
    booleanFields.forEach((field) => {
      if (data[field] === 'true') {
        data[field] = true;
      } else if (data[field] === 'false') {
        data[field] = false;
      }
    });
    console.log('Valor de isPosted recebido no update:', data.isPosted);
    if (!existingRealEstate) {
      throw new NotFoundException('Imóvel não encontrado.');
    }
    try {
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
        yard:
          data.yard !== undefined
            ? Boolean(data.yard)
            : existingRealEstate.yard,
        pool:
          data.pool !== undefined
            ? Boolean(data.pool)
            : existingRealEstate.pool,
        isPosted:
          data.isPosted !== undefined
            ? Boolean(data.isPosted)
            : existingRealEstate.isPosted,
        registration: data.registration || existingRealEstate.registration,
        images: [],
      };
      console.log(
        'Valor de isPosted recebido apos o updateddata:',
        updatedData.isPosted,
      );
      if (images && images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(async (image) => {
            const url = await this.uploadToS3(image);
            console.log('Uploaded image URL:', url);
            return url;
          }),
        );
        updatedData.images = imageUrls;
      } else {
        updatedData.images = existingRealEstate.images;
      }

      if (updatedData.isPosted) {
        const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;

        const realEstateUrl = `${process.env.FRONTEND_URL}/${id}`;
        const message = `
          🏠 Novo imóvel disponível\n💬 ${updatedData.description}\n💵 R$ ${updatedData.salePrice}\n🔗 Confira mais detalhes: ${realEstateUrl}
        `;

        try {
          if (updatedData.images?.length > 0) {
            const imageForPost = updatedData.images[0];
            const response = await axios.post(
              `https://graph.facebook.com/v21.0/${pageId}/photos`,
              {
                message,
                url: imageForPost,
                access_token: pageAccessToken,
              },
            );
            console.log('Resposta do Facebook:', response.data);
            if (response.data.id) {
              updatedData.isPosted = true;
            }
          } else {
            const response = await axios.post(
              `https://graph.facebook.com/v21.0/${pageId}/feed`,
              {
                message,
                access_token: pageAccessToken,
              },
            );

            if (response.data.id) {
              updatedData.isPosted = true;
            }
          }
        } catch (error) {
          console.error('Erro ao postar no Facebook durante update:', error);
        }
      }
      console.log(
        'Valor de isPosted recebido apos a logica do updateddata:',
        updatedData.isPosted,
      );
      const updatedRealEstate = await this.prisma.realEstate.update({
        where: { id },
        data: updatedData,
      });

      console.log('Payload recebido no update:', updatedRealEstate);
      return updatedRealEstate;
    } catch (error) {
      console.error('Erro ao atualizar imóvel:', error);
      throw new InternalServerErrorException('Erro ao atualizar o imóvel.');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.realEstate.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error);
      throw new InternalServerErrorException('Erro ao excluir o imóvel.');
    }
  }
  async generateRealEstateReport(filters: any, userId: number) {
    try {
      const whereConditions: any = {
        userId,
      };

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
    } catch (error) {
      console.error('Erro ao gerar relatório de imóveis:', error);
      throw new InternalServerErrorException(
        'Erro ao gerar relatório de imóveis.',
      );
    }
  }
  async generatePdfReport(realEstates: RealEstate[]): Promise<Buffer> {
    const imageUrl =
      'https://bucket-aimob-images.s3.us-east-2.amazonaws.com/logosemfundo_azul.png';
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
      });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc
        .fontSize(20)
        .text('Relatório de Imóveis', { align: 'center' })
        .image(imageBuffer, 480, 20, { width: 80 })
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
          .text(`Área Total: ${realEstate.totalArea || 'N/A'} m²`, {
            width: 500,
          })
          .text(`Quartos: ${realEstate.bedrooms || 'N/A'}`, { width: 500 })
          .text(`Banheiros: ${realEstate.bathrooms || 'N/A'}`, { width: 500 })
          .text(`Garagem: ${realEstate.garage ? 'Sim' : 'Não'}`, { width: 500 })
          .text(
            `Preço de Venda: ${
              realEstate.salePrice ? `R$ ${realEstate.salePrice}` : 'N/A'
            }`,
            { width: 500 },
          )
          .text(
            `Status: ${realEstate.status ? 'Disponível' : 'Indisponível'}`,
            {
              width: 500,
            },
          )
          .moveDown(1);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);
      });

      doc.end();
    });
  }
}

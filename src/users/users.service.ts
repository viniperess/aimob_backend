import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { S3 } from 'aws-sdk';

@Injectable()
export class UsersService {
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
      Key: `${Date.now()}-${image.originalname}`,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult.Location;
  }

  async create(data: any, image?: Express.Multer.File): Promise<User> {
    const existEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    const existUser = await this.prisma.user.findUnique({
      where: { user: data.user },
    });

    if (existEmail) {
      throw new BadRequestException('O email já está em uso.');
    }
    if (existUser) {
      throw new BadRequestException('O nome de usuário já está em uso.');
    }
    if (image) {
      data.image = await this.uploadToS3(image);
    } else {
      data.image =
        'https://img.freepik.com/vetores-premium/icone-de-perfil-de-avatar-padrao-imagem-de-usuario-de-midia-social-cinza-avatar-icone-em-branco-silhueta-vetor-ilustracao_561158-3485.jpg?w=740';
    }

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      if (hashedPassword === data.password) {
        throw new BadRequestException('Password hashing falha');
      }

      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
      return user;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }
  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new InternalServerErrorException('Erro ao buscar usuários.');
    }
  }

  async findOne(id: number): Promise<User> {
    const foundOneUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!foundOneUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return foundOneUser;
  }

  async findByUser(user: string): Promise<User> {
    const foundUser = await this.prisma.user.findFirst({
      where: { user },
    });
    if (!foundUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return foundUser;
  }

  async update(
    id: number,
    data: Partial<User>,
    image?: Express.Multer.File,
  ): Promise<User> {
    const updatedData: Partial<User> = { ...data };
    if (image) {
      const imageUrl = await this.uploadToS3(image);
      updatedData.image = imageUrl;
    }
    if (data.password) {
      updatedData.password = await bcrypt.hash(data.password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updatedData,
      });
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new InternalServerErrorException('Erro ao atualizar usuário.');
    }
  }

  async remove(id: number) {
    try {
      const deletedUser = await this.prisma.user.delete({
        where: { id },
      });
      return deletedUser;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw new InternalServerErrorException('Erro ao excluir usuário.');
    }
  }
}

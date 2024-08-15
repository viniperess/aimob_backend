import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any): Promise<User> {
    const existEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    const existUser = await this.prisma.user.findUnique({
      where: { user: data.user },
    });

    if (existEmail) {
      throw new Error('Email already exists.');
    }
    if (existUser) {
      throw new Error('User already exists.');
    }

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      if (hashedPassword === data.password) {
        throw new Error('Password hashing failed');
      }

      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
      return user;
    } catch (error) {
      throw new Error('Error during password hashing');
    }
  }

  async findAll(): Promise<User[]> {
    const foundAllUser = await this.prisma.user.findMany();
    return foundAllUser;
  }

  async findOne(id: number): Promise<User> {
    const foundOneUser = await this.prisma.user.findUnique({
      where: { id },
    });
    return foundOneUser;
  }

  async findByUser(user: string): Promise<User> {
    const foundUser = await this.prisma.user.findFirst({
      where: { user },
    });
    return foundUser;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    return updatedUser;
  }

  async remove(id: number) {
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });
    return deletedUser;
  }
}

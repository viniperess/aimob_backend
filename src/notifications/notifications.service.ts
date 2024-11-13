import { Injectable } from '@nestjs/common';

import { Notification, PrismaClient } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    const createNotification = await this.prisma.notification.create({
      data: {
        ...data,
      },
    });
    return createNotification;
  }

  async findAll(userId: number) {
    return await this.prisma.notification.findMany({
      where: {
        task: {
          userId,
        },
      },
      include: {
        task: true,
      },
    });
  }
  async findOne(id: number, userId: number) {
    const foundOneNotification = await this.prisma.notification.findFirst({
      where: { id, task: { userId } },
      include: { task: true },
    });
    return foundOneNotification;
  }

  async update(id: number, data: Partial<Notification>) {
    const updateNotification = await this.prisma.notification.update({
      where: { id },
      data,
    });
    return updateNotification;
  }

  async remove(id: number) {
    const deleteNotification = await this.prisma.notification.delete({
      where: { id },
    });
    return deleteNotification;
  }
}

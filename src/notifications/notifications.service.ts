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

  async findAll() {
    const foundAllNotifications = await this.prisma.notification.findMany({
      include: {
        task: true,
      },
    });
    return foundAllNotifications;
  }

  async findOne(id: number) {
    const foundOneNotification = await this.prisma.notification.findUnique({
      where: { id },
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

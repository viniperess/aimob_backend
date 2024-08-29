import { Injectable, NotFoundException } from '@nestjs/common';
import { Contact, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaClient,
    private readonly realEstatesService: RealestatesService,
  ) {}

  async create(data: any) {
    const existEmail = await this.prisma.contact.findUnique({
      where: { email: data.email },
    });

    if (existEmail) {
      throw new Error('Email already exists.');
    }

    const contacts = await this.prisma.contact.create({
      data: {
        ...data,
      },
    });

    return contacts;
  }

  async createContactBasic(data: any) {
    const { taskStatus, taskDescription, estateId, ...contactsData } = data;

    let contact = await this.prisma.contact.findUnique({
      where: { email: contactsData.email },
    });

    if (contact) {
      contact = await this.prisma.contact.update({
        where: { email: contactsData.email },
        data: contactsData,
      });
    } else {
      contact = await this.prisma.contact.create({
        data: contactsData,
      });
    }

    const realEstate = await this.realEstatesService.findOne(estateId);
    if (!realEstate) {
      throw new NotFoundException('Real estate not found');
    }

    const userId = realEstate.userId;

    if (!userId) {
      throw new Error('UserId is null or undefined');
    }

    const createTask = await this.prisma.task.create({
      data: {
        status: taskStatus,
        description: taskDescription,
        userId: userId,
        contactId: contact.id,
        estateId: estateId,
      },
    });

    const createNotification = await this.prisma.notification.create({
      data: {
        taskId: createTask.id,
      },
    });

    console.log(createTask, contact, createNotification);

    return contact;
  }

  async findAll(): Promise<Contact[]> {
    const foundAllContacts = await this.prisma.contact.findMany();
    return foundAllContacts;
  }

  async findOne(id: number) {
    const foundOneContact = await this.prisma.contact.findUnique({
      where: { id },
    });
    return foundOneContact;
  }

  async update(id: number, data: Partial<Contact>): Promise<Contact> {
    const updatedContact = await this.prisma.contact.update({
      where: { id },
      data,
    });
    return updatedContact;
  }

  async remove(id: number) {
    const deletedContact = await this.prisma.contact.delete({
      where: { id },
    });
    return deletedContact;
  }
}

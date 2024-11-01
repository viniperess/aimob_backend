import { Injectable, NotFoundException } from '@nestjs/common';
import { Contact, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';
import PDFDocument = require('pdfkit');

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

  async generateClienteReport(filter: 'all' | '15days' | 'today') {
    const today = new Date();
    let dateFilter;

    if (filter === '15days') {
      dateFilter = new Date(today.setDate(today.getDate() - 15));
    } else if (filter === 'today') {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      dateFilter = { startOfDay, endOfDay };
    }

    const contacts = await this.prisma.contact.findMany({
      where: dateFilter
        ? {
            createdAt:
              filter === 'today'
                ? {
                    gte: dateFilter.startOfDay,
                    lte: dateFilter.endOfDay,
                  }
                : {
                    gte: dateFilter,
                  },
          }
        : {},
    });
    return this.generatePdfReport(contacts);
  }
  async generatePdfReport(contacts: Contact[]): Promise<Buffer> {
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
        .text('Relatório de Contatos Novos', { align: 'center' })
        .image(
          'https://bucket-aimob-images.s3.us-east-2.amazonaws.com/logosemfundo_azul.png',
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

      contacts.forEach((contact) => {
        doc
          .fillColor('#000000')
          .text(`Nome: ${contact.name}`, { width: 200 })
          .text(`Email: ${contact.email}`, { width: 200 })
          .text(`Telefone: ${contact.phone}`, { width: 200 })
          .text(`Data da Criação: ${contact.createdAt.toLocaleDateString()}`, {
            width: 200,
          })
          .moveDown(1);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);
      });

      doc.end();
    });
  }
}

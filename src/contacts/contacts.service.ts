import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Contact, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';
import PDFDocument = require('pdfkit');
import axios from 'axios';

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
      throw new BadRequestException('O e-mail já está registrado.');
    }

    try {
      const contact = await this.prisma.contact.create({
        data: {
          ...data,
        },
      });
      return contact;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw new InternalServerErrorException(
        'Erro ao criar o contato. Tente novamente.',
      );
    }
  }

  async createContactBasic(data: any) {
    const { taskStatus, taskDescription, estateId, ...contactsData } = data;
    try {
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
        throw new NotFoundException('Imóvel não encontrado.');
      }
      const userId = realEstate.userId;

      if (!userId) {
        throw new InternalServerErrorException(
          'Erro ao associar usuário ao contato.',
        );
      }

      contact = await this.prisma.contact.update({
        where: { id: contact.id },
        data: { userId },
      });

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
    } catch (error) {
      console.error('Erro ao criar contato básico:', error);
      throw new InternalServerErrorException(
        'Erro ao criar o contato básico. Tente novamente.',
      );
    }
  }

  async findAll(userId: number): Promise<Contact[]> {
    try {
      const contacts = await this.prisma.contact.findMany({
        where: { userId },
      });
      return contacts;
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar os contatos. Tente novamente.',
      );
    }
  }

  async findOne(id: number, userId: number): Promise<Contact> {
    const foundOneContact = await this.prisma.contact.findFirst({
      where: { id, userId },
    });
    if (!foundOneContact) {
      throw new NotFoundException('Contato não encontrado.');
    }
    return foundOneContact;
  }

  async update(
    id: number,
    data: Partial<Contact>,
    userId: number,
  ): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId },
    });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado.');
    }
    return await this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, userId: number) {
    console.log(`Iniciando exclusão do contato: ${id} pelo usuário: ${userId}`);

    // Verificar se o contato existe
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId },
      include: { tasks: true, appointments: true },
    });

    if (!contact) {
      console.error(`Contato não encontrado: ${id}`);
      throw new Error('Contato não encontrado.');
    }

    // Excluir tarefas relacionadas
    if (contact.tasks.length > 0) {
      console.log(
        `Excluindo ${contact.tasks.length} tarefas relacionadas ao contato ${id}`,
      );
      await this.prisma.task.deleteMany({
        where: { contactId: id },
      });
    }

    // Excluir agendamentos relacionados
    if (contact.appointments.length > 0) {
      console.log(
        `Excluindo ${contact.appointments.length} agendamentos relacionados ao contato ${id}`,
      );
      await this.prisma.appointment.deleteMany({
        where: { contactId: id },
      });
    }

    // Excluir o contato
    try {
      console.log(`Excluindo contato: ${id}`);
      await this.prisma.contact.delete({
        where: { id },
      });
      console.log(`Contato ${id} excluído com sucesso.`);
    } catch (error) {
      console.error(`Erro ao excluir contato ${id}:`, error);
      throw new Error('Erro ao excluir o contato.');
    }
  }

  async generateClienteReport(
    filter: 'all' | '15days' | 'today',
    userId: number,
  ) {
    const today = new Date();
    let dateFilter;

    if (filter === '15days') {
      dateFilter = new Date(today.setDate(today.getDate() - 15));
    } else if (filter === 'today') {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      dateFilter = { startOfDay, endOfDay };
    }
    try {
      const contacts = await this.prisma.contact.findMany({
        where: {
          userId,
          createdAt: dateFilter
            ? filter === 'today'
              ? {
                  gte: dateFilter.startOfDay,
                  lte: dateFilter.endOfDay,
                }
              : { gte: dateFilter }
            : undefined,
        },
      });
      return this.generatePdfReport(contacts);
    } catch (error) {
      console.error('Erro ao gerar relatório de clientes:', error);
      throw new InternalServerErrorException(
        'Erro ao gerar o relatório de clientes. Tente novamente.',
      );
    }
  }
  async generatePdfReport(contacts: Contact[]): Promise<Buffer> {
    const imageUrl =
      'https://bucket-aimob-images.s3.us-east-2.amazonaws.com/logosemfundo_azul.png';
    try {
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
          .text('Relatório de Contatos Novos', { align: 'center' })
          .image(imageBuffer, 480, 20, { width: 80 })
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
            .text(
              `Data da Criação: ${contact.createdAt.toLocaleDateString()}`,
              {
                width: 200,
              },
            )
            .moveDown(1);

          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);
        });

        doc.end();
      });
    } catch (error) {
      console.error('Erro ao gerar PDF de relatório:', error);
      throw new InternalServerErrorException(
        'Erro ao gerar o relatório em PDF.',
      );
    }
  }
}

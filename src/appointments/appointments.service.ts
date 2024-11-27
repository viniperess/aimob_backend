import { config } from 'dotenv';
config();
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, Task, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';
import * as nodemailer from 'nodemailer';
import { format, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import PDFDocument = require('pdfkit');

@Injectable()
export class AppointmentsService {
  private transporter: nodemailer.Transporter;
  private client: any;
  constructor(
    private prisma: PrismaClient,
    private readonly realEstatesService: RealestatesService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  async create(data: any) {
    const {
      estateId,
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      taskStatus,
      taskDescription,
      visitDate,
      ...appointmentsData
    } = data;
    if (!visitDate) {
      throw new BadRequestException('A data da visita é obrigatória.');
    }
    if (!contactId && (!contactEmail || !contactName)) {
      throw new BadRequestException(
        'Informações de contato são obrigatórias se o ID do contato não for fornecido.',
      );
    }
    try {
      const realEstate = await this.realEstatesService.findOne(estateId);
      if (!realEstate) {
        throw new NotFoundException('Imóvel não encontrado.');
      }

      const userId = realEstate.userId;

      if (!userId) {
        throw new InternalServerErrorException(
          'Erro ao obter o usuário do imóvel.',
        );
      }

      let contact;

      if (contactId) {
        contact = await this.prisma.contact.findUnique({
          where: { id: contactId },
        });

        if (!contact) {
          throw new NotFoundException('Contato não encontrado.');
        }
      } else {
        contact = await this.prisma.contact.findUnique({
          where: { email: contactEmail },
        });

        if (!contact) {
          contact = await this.prisma.contact.create({
            data: {
              name: contactName,
              email: contactEmail,
              phone: contactPhone,
              userId,
            },
          });
        } else if (contact.email === contactEmail) {
          contact = await this.prisma.contact.update({
            where: { email: contactEmail },
            data: { name: contactName, phone: contactPhone },
          });
        }
      }

      const existingAppointment = await this.prisma.appointment.findFirst({
        where: {
          visitDate: new Date(visitDate),
          estateId,
          userId,
        },
      });
      if (existingAppointment) {
        throw new BadRequestException(
          'Já existe um agendamento para essa data.',
        );
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

      const createdAppointment = await this.prisma.appointment.create({
        data: {
          ...appointmentsData,
          userId: userId,
          estateId: realEstate.id,
          contactId: contact.id,
          visitDate: visitDate,
          visitApproved: false,
        },
      });

      const updateTask = await this.prisma.task.update({
        where: { id: createTask.id },
        data: {
          appointmentId: createdAppointment.id,
        },
      });

      await this.prisma.notification.create({
        data: {
          taskId: createTask.id,
        },
      });

      console.log(
        'Created appointment:',
        createdAppointment,
        createTask,
        updateTask,
      );
      return createdAppointment;
    } catch (error) {
      console.error('Erro ao criar o agendamento:', error);
      throw new InternalServerErrorException(
        'Erro ao criar o agendamento. Tente novamente.',
      );
    }
  }

  async findAll(userId: number): Promise<Appointment[]> {
    try {
      return await this.prisma.appointment.findMany({
        where: { userId },
        include: {
          contact: true,
          realEstate: true,
          tasks: true,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar agendamentos. Tente novamente.',
      );
    }
  }

  async findOne(id: number, userId: number): Promise<Appointment> {
    const foundOneAppointment = await this.prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        contact: true,
        realEstate: true,
      },
    });

    if (!foundOneAppointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    return foundOneAppointment;
  }

  async update(
    id: number,
    data: Partial<Appointment>,
    userId: number,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, userId },
      include: { contact: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    try {
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id, userId },
        data,
      });

      if (
        appointment.contact?.email &&
        (data.visitApproved === true || data.visitApproved === false)
      ) {
        let subject: string;
        let message: string;

        if (data.visitApproved === true) {
          subject = 'Confirmação de Agendamento Aprovado';
          const adjustedVisitDate = subHours(appointment.visitDate, 3);
          const formattedDate = format(
            adjustedVisitDate,
            "dd/MM/yyyy 'às' HH:mm",
            { locale: ptBR },
          );
          message = `Seu agendamento foi aprovado para a data e hora: ${formattedDate}.`;
        } else if (data.visitApproved === false) {
          subject = 'Agendamento Recusado';
          message =
            'Infelizmente, seu agendamento foi recusado. Entre em contato para mais detalhes.';
        }

        console.log(`Enviando e-mail para ${appointment.contact.email}...`);
        await this.sendEmail(appointment.contact.email, subject, message);
      }
      return updatedAppointment;
    } catch (error) {
      console.error('Erro ao atualizar o agendamento:', error);
      throw new InternalServerErrorException(
        'Erro ao atualizar o agendamento. Tente novamente.',
      );
    }
  }

  async sendEmail(to: string, subject: string, text: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('E-mail enviado com sucesso');
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw new InternalServerErrorException(
        'Erro ao enviar o e-mail de confirmação.',
      );
    }
  }
  async remove(id: number, userId: number) {
    console.log('Tentando excluir agendamento:', id, 'Usuário:', userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });

    if (!appointment) {
      console.error('Agendamento não encontrado:', id);
      throw new NotFoundException('Agendamento não encontrado.');
    }

    try {
      const deletedAppointment = await this.prisma.appointment.delete({
        where: { id },
      });
      console.log('Agendamento excluído com sucesso:', deletedAppointment);
      return deletedAppointment;
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      throw new InternalServerErrorException('Erro ao excluir agendamento.');
    }
  }

  async generateAppointmentReport(
    filter: 'all' | 'completed' | 'pending' | 'monthly' | 'progress',
    userId: number,
    month?: number,
  ) {
    try {
      const today = new Date();
      const whereClause: any = { userId };

      // Aplica o filtro de status
      if (filter === 'completed') {
        whereClause.tasks = { some: { status: { equals: 'Concluído' } } };
      } else if (filter === 'pending') {
        whereClause.tasks = { some: { status: { equals: 'Pendente' } } };
      } else if (filter === 'progress') {
        whereClause.tasks = { some: { status: { equals: 'Em Progresso' } } };
      }

      // Aplica o filtro de mês como adicional ao filtro de status
      if (month !== undefined) {
        const startDate = new Date(today.getFullYear(), month - 1, 1);
        const endDate = new Date(today.getFullYear(), month, 0);
        whereClause.visitDate = { gte: startDate, lte: endDate };
      }

      const appointments = await this.prisma.appointment.findMany({
        where: whereClause,
        include: {
          realEstate: {
            select: {
              street: true,
              city: true,
              number: true,
              complement: true,
            },
          },
          contact: { select: { name: true } },
          tasks: { select: { status: true } },
        },
      });

      return this.generatePdfReport(appointments);
    } catch (error) {
      console.error('Erro ao gerar relatório de agendamentos:', error);
      throw new InternalServerErrorException(
        'Erro ao gerar o relatório de agendamentos. Tente novamente.',
      );
    }
  }

  private async generatePdfReport(
    appointments: (Appointment & {
      tasks: { status: string }[];
      realEstate: {
        street: string;
        city: string;
        number: string;
        complement: string;
      };
      contact: { name: string };
    })[],
  ): Promise<Buffer> {
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
          .text('Relatório de Agendamentos', { align: 'center' })
          .image(imageBuffer, 480, 20, { width: 80 })
          .moveDown();

        doc
          .fontSize(12)
          .text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, {
            align: 'right',
          })
          .moveDown();

        doc.fontSize(12).font('Helvetica');

        appointments.forEach((appointment) => {
          const taskStatuses = appointment.tasks
            .map((task) => task.status)
            .join(', ');
          const adjustedVisitDate = subHours(
            new Date(appointment.visitDate),
            3,
          );

          doc
            .fillColor('#000000')
            .text(
              `Imóvel: ${appointment.realEstate?.street} - ${appointment.realEstate?.number} ${appointment.realEstate?.complement}, ${appointment.realEstate?.city}`,
              { width: 350 },
            )
            .text(`Cliente: ${appointment.contact?.name}`, { width: 300 })
            .text(`Status das Tarefas: ${taskStatuses}`, { width: 200 })
            .text(
              `Data e Hora do Agendamento: ${format(
                adjustedVisitDate,
                "dd/MM/yyyy 'às' HH:mm",
                { locale: ptBR },
              )}`,
              { width: 300 },
            )
            .text(`Observação: ${appointment.observation || 'N/A'}`, {
              width: 350,
            })
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

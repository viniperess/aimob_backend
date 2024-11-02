import { config } from 'dotenv';
config();
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';
import * as nodemailer from 'nodemailer';
import { format, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      throw new BadRequestException('visitDate is required');
    }
    if (!contactId && (!contactEmail || !contactName)) {
      throw new BadRequestException(
        'Contact information is required if no contact ID is provided',
      );
    }

    const realEstate = await this.realEstatesService.findOne(estateId);
    if (!realEstate) {
      throw new NotFoundException('Real estate not found');
    }

    const userId = realEstate.userId;

    if (!userId) {
      throw new Error('UserId is null or undefined');
    }

    let contact;

    if (contactId) {
      contact = await this.prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
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
      where: { visitDate: new Date(visitDate) },
    });

    if (existingAppointment) {
      throw new NotFoundException('Appointment with this date not available');
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
        status: 'Aguardando Visita',
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
  }

  async findAll(): Promise<Appointment[]> {
    const foundAllAppointment = await this.prisma.appointment.findMany({
      include: {
        contact: true,
        realEstate: true,
      },
    });
    return foundAllAppointment;
  }

  async findOne(id: number): Promise<Appointment> {
    const foundOneAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        contact: true,
        realEstate: true,
      },
    });
    return foundOneAppointment;
  }

  async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data,
    });
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (appointment && appointment.contact && appointment.contact.email) {
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
    }
  }
  async remove(id: number) {
    const deletedAppointment = await this.prisma.appointment.delete({
      where: { id },
    });
    return deletedAppointment;
  }
}

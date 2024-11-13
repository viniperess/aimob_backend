import { config } from 'dotenv';
config();
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
        where: { visitDate: new Date(visitDate) },
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
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    try {
      return await this.prisma.appointment.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Erro ao excluir o agendamento:', error);
      throw new InternalServerErrorException(
        'Erro ao excluir o agendamento. Tente novamente.',
      );
    }
  }
}

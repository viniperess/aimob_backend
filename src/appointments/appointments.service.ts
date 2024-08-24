import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, PrismaClient } from '@prisma/client';
import { RealestatesService } from 'src/realestates/realestates.service';
import twilio from 'twilio';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class AppointmentsService {
  private client: any;
  constructor(
    private prisma: PrismaClient,
    private readonly realEstatesService: RealestatesService,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = twilio(accountSid, authToken);
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

    if (appointment && appointment.contact && appointment.contact.phone) {
      let message: string;

      if (data.visitApproved === true) {
        message = `Seu Agendamento foi Aprovado!`;
        console.log('Enviando SMS de aprovação...');
        await this.sendSms(
          appointment.contact.phone,
          message,
          appointment.visitDate,
        );
      } else if (data.visitApproved === false) {
        message = `Seu Agendamento foi Recusado!`;
        console.log('Enviando SMS de recusa...');
        await this.sendSms(appointment.contact.phone, message, null);
      }
    }

    return updatedAppointment;
  }

  async sendSms(phone: string, message: string, visitDate: Date | null) {
    try {
      let fullMessage = message;
      if (visitDate) {
        const formattedDate = format(visitDate, "dd/MM/yyyy 'às' HH:mm", {
          locale: ptBR,
        });

        fullMessage += ` - Data e Hora: ${formattedDate}`;
      }
      const response = await this.client.messages.create({
        body: fullMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      console.log('SMS enviado com sucesso', response.sid);
    } catch (error) {
      console.error('Failed to send SMS', error);
    }
  }

  async remove(id: number) {
    const deletedAppointment = await this.prisma.appointment.delete({
      where: { id },
    });
    return deletedAppointment;
  }
}

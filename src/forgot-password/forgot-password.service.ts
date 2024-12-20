import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
config();

@Injectable()
export class ForgotPasswordService {
  constructor(private prisma: PrismaClient) {}

  async sendResetCode(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const resetCode = uuidv4().slice(0, 6);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetCode },
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha',
      text: `Seu código de recuperação de senha é: ${resetCode}`,
    };

    await transporter.sendMail(mailOptions);

    return 'Código de redefinição enviado com sucesso!';
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.resetCode !== code) {
      throw new BadRequestException('Código de redefinição inválido.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, resetCode: null },
      });

      return 'Senha redefinida com sucesso!';
    } catch (error) {
      console.error('Erro ao redefinir a senha:', error);
      throw new InternalServerErrorException(
        'Erro ao redefinir a senha. Tente novamente.',
      );
    }
  }
}

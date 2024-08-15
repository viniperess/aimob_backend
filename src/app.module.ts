import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RealestatesModule } from './realestates/realestates.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ContactsModule } from './contacts/contacts.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ForgotPasswordModule } from './forgot-password/forgot-password.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RealestatesModule,
    AppointmentsModule,
    ContactsModule,
    TasksModule,
    NotificationsModule,
    ForgotPasswordModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}

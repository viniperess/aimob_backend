import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { AuthRequest } from 'src/auth/models/AuthRequest';
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @IsPublic()
  @Post()
  create(@Body() notification: Notification) {
    return this.notificationsService.create(notification);
  }

  @Get()
  findAll(@Req() request: AuthRequest) {
    const userId = request.user.id;
    return this.notificationsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return this.notificationsService.findOne(+id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() notification: Notification) {
    return this.notificationsService.update(+id, notification);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.notificationsService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @IsPublic()
  @Post()
  create(@Body() notification: Notification) {
    return this.notificationsService.create(notification);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.notificationsService.findOne(+id);
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

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
import { TasksService } from './tasks.service';
import { Task } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { AuthRequest } from 'src/auth/models/AuthRequest';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @IsPublic()
  @Post()
  create(@Body() task: Task) {
    return this.tasksService.create(task);
  }

  @Get()
  async findAll(@Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.tasksService.findAll(userId);
  }
  @Get(':id')
  async findOne(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.tasksService.findOne(+id, userId);
  }
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() task: Task,
    @Req() request: AuthRequest,
  ) {
    const userId = request.user.id;
    return this.tasksService.update(+id, task, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return this.tasksService.remove(+id, userId);
  }
}

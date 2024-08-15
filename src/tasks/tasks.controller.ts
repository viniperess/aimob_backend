import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @IsPublic()
  @Post()
  create(@Body() task: Task) {
    return this.tasksService.create(task);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() task: Task) {
    return this.tasksService.update(+id, task);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.tasksService.remove(+id);
  }
}

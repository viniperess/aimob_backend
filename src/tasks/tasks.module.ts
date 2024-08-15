import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [PrismaModule],
  exports: [TasksService],
})
export class TasksModule {}

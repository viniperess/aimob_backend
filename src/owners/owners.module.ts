import { Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService],
  imports: [PrismaModule],
  exports: [OwnersService],
})
export class OwnersModule {}

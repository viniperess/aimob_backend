import { Module } from '@nestjs/common';
import { RealestatesService } from './realestates.service';
import { RealestatesController } from './realestates.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [RealestatesController],
  providers: [RealestatesService],
  imports: [PrismaModule],
  exports: [RealestatesService],
})
export class RealestatesModule {}

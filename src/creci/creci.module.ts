import { Module } from '@nestjs/common';
import { CreciService } from './creci.service';
import { CreciController } from './creci.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [CreciController],
  providers: [CreciService],
  imports: [PrismaModule],
  exports: [CreciService],
})
export class CreciModule {}

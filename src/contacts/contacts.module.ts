import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from 'src/prisma.module';
import { RealestatesModule } from 'src/realestates/realestates.module';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
  imports: [PrismaModule, RealestatesModule],
  exports: [ContactsService],
})
export class ContactsModule {}

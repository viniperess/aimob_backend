import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { Response } from 'express';
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @IsPublic()
  @Post()
  create(@Body() contact: Contact) {
    return this.contactsService.create(contact);
  }

  @IsPublic()
  @Post('basic')
  createContactBasic(@Body() contact: Contact) {
    return this.contactsService.createContactBasic(contact);
  }

  @Get('report')
  async getClientReport(
    @Query('filter') filter: 'all' | '15days' | 'today',
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.contactsService.generateClienteReport(filter);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio-clientes.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  findAll(): Promise<Contact[]> {
    return this.contactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Contact | null> {
    return this.contactsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() contact: Contact,
  ): Promise<Contact | null> {
    return this.contactsService.update(+id, contact);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.contactsService.remove(+id);
  }
}

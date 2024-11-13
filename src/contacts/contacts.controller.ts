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
  Req,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { Response } from 'express';
import { AuthRequest } from 'src/auth/models/AuthRequest';
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
    @Req() request: AuthRequest,
  ) {
    const userId = request.user.id;
    const pdfBuffer = await this.contactsService.generateClienteReport(
      filter,
      userId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio-clientes.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  async findAll(@Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.contactsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.contactsService.findOne(+id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() contact: Contact,
    @Req() request: AuthRequest,
  ): Promise<Contact | null> {
    const userId = request.user.id;
    return this.contactsService.update(+id, contact, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() request: AuthRequest) {
    const userId = request.user.id;
    return this.contactsService.remove(+id, userId);
  }
}

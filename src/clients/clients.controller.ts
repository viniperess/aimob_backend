import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from '@prisma/client';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() client: Client, @Request() req) {
    return this.clientsService.create(client, req.user.id);
  }

  @Get()
  findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Client | null> {
    return this.clientsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() client: Client) {
    return this.clientsService.update(+id, client);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.clientsService.remove(+id);
  }
}

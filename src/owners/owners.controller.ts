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
import { OwnersService } from './owners.service';
import { Owner } from '@prisma/client';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  create(@Body() owner: Owner, @Request() req) {
    return this.ownersService.create(owner, req.user.id);
  }

  @Get()
  findAll(): Promise<Owner[]> {
    return this.ownersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Owner | null> {
    return this.ownersService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() owner: Owner): Promise<Owner | null> {
    return this.ownersService.update(+id, owner);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.ownersService.remove(+id);
  }
}

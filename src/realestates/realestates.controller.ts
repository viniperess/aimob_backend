import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { RealestatesService } from './realestates.service';
import { RealEstate } from '@prisma/client';

@Controller('realestates')
export class RealestatesController {
  constructor(private readonly realestatesService: RealestatesService) {}

  @Post()
  create(@Body() realEstate: RealEstate) {
    return this.realestatesService.create(
      realEstate,
      realEstate.ownerId,
      realEstate.employeeId,
    );
  }

  @Get()
  findAll(): Promise<RealEstate[]> {
    return this.realestatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<RealEstate | null> {
    return this.realestatesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() realEstate: RealEstate,
  ): Promise<RealEstate> {
    return this.realestatesService.update(+id, realEstate);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<RealEstate> {
    return this.realestatesService.remove(+id);
  }
}

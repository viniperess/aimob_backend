import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { RealestatesService } from './realestates.service';
import { RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('realestates')
export class RealestatesController {
  constructor(private readonly realestatesService: RealestatesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  create(
    @Body() realEstate: RealEstate,
    @UploadedFiles() images: Express.Multer.File[],
    @Req() request: AuthRequest,
  ) {
    return this.realestatesService.create(realEstate, request);
  }
  @IsPublic()
  @Get()
  findAll(): Promise<RealEstate[]> {
    return this.realestatesService.findAll();
  }

  @IsPublic()
  @Get('search')
  searchProjects(@Query('type') type: string): Promise<RealEstate[] | null> {
    return this.realestatesService.searchRealEstate(type);
  }
  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: number): Promise<RealEstate | null> {
    return this.realestatesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id') id: number,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() realEstate: RealEstate,
  ): Promise<RealEstate> {
    return this.realestatesService.update(+id, realEstate);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<RealEstate> {
    return this.realestatesService.remove(+id);
  }
}

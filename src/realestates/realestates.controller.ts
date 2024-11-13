import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFiles,
  Query,
  Res,
} from '@nestjs/common';
import { RealestatesService } from './realestates.service';
import { RealEstate } from '@prisma/client';
import { AuthRequest } from 'src/auth/models/AuthRequest';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { Response } from 'express';

@Controller('realestates')
export class RealestatesController {
  constructor(private readonly realestatesService: RealestatesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  create(
    @Body() realEstate: RealEstate,
    @UploadedFiles() images: Express.Multer.File[],
    @Req()
    request: AuthRequest,
  ) {
    return this.realestatesService.create(realEstate, request, images);
  }

  @Get('report')
  async getRealEstateReport(
    @Query()
    filters: {
      bedrooms?: string;
      bathrooms?: string;
      minPrice?: string;
      maxPrice?: string;
      status?: boolean;
    },
    @Res() res: Response,
    @Req() request: AuthRequest,
  ) {
    const userId = request.user.id;
    const pdfBuffer = await this.realestatesService.generateRealEstateReport(
      filters,
      userId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio-imoveis.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  async findAll(@Req() request: AuthRequest) {
    const userId = request.user.id;
    return await this.realestatesService.findAll(userId);
  }

  @IsPublic()
  @Get('available')
  async findAllAvailable() {
    return await this.realestatesService.findAllAvailable();
  }

  @IsPublic()
  @Get('advance-search')
  async advanceSearch(
    @Query()
    filters: {
      bedrooms?: string;
      bathrooms?: string;
      kitchens?: string;
      livingRooms?: string;
      minPrice?: string;
      maxPrice?: string;
      type?: string;
      garage?: string;
      yard?: string;
      pool?: string;
    },
  ): Promise<RealEstate[]> {
    console.log('Filtros recebidos:', filters);
    const results = await this.realestatesService.advanceSearch(filters);

    console.log('Resultado da busca:', results);
    return results;
  }

  @IsPublic()
  @Get('search')
  searchProjects(@Query('type') type: string): Promise<RealEstate[] | null> {
    return this.realestatesService.searchRealEstate(type);
  }

  @IsPublic()
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.realestatesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id') id: number,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() realEstate: RealEstate,
  ): Promise<RealEstate> {
    return this.realestatesService.update(+id, realEstate, images);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<RealEstate> {
    return this.realestatesService.remove(+id);
  }
}

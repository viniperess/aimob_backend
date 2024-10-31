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
  ) {
    const pdfBuffer = await this.realestatesService.generateRealEstateReport(
      filters,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio-imoveis.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @IsPublic()
  @Get()
  findAll(): Promise<RealEstate[]> {
    return this.realestatesService.findAll();
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

    console.log('Resultado da busca:', results); // Log para verificar o resultado da busca
    return results;
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
    return this.realestatesService.update(+id, realEstate, images);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<RealEstate> {
    return this.realestatesService.remove(+id);
  }
}

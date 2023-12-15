import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { Contract } from '@prisma/client';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() contract: Contract) {
    return this.contractsService.create(contract);
  }

  @Get()
  findAll(): Promise<Contract[]> {
    return this.contractsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Contract> {
    return this.contractsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() contract: Contract,
  ): Promise<Contract> {
    return this.contractsService.update(+id, contract);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.contractsService.remove(+id);
  }
}
